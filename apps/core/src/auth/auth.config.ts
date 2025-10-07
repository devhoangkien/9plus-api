import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { ac, roles } from './permissions';
import { PrismaClient } from 'prisma/@generated/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
      },
      emailVerified: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
    },
  },

  advanced: {
    generateId: () => {
      // Custom ID generation using crypto
      return crypto.randomUUID();
    },
    cookiePrefix: 'anineplus',
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.COOKIE_DOMAIN || 'localhost',
    },
  },

  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.GATEWAY_URL || 'http://localhost:3001',
  ],

  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },

  plugins: [
    organization({
      // Access control configuration
      ac,
      roles,

      // Dynamic Access Control (DAC) - allows creating roles at runtime
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: async (organizationId) => {
          // Dynamic limit based on organization plan
          // TODO: Implement plan checking logic
          return 20; // Default limit
        },
      },

      // Allow users to create organizations
      allowUserToCreateOrganization: true,

      // Maximum organizations per user
      organizationLimit: 10,

      // Creator role when organization is created
      creatorRole: 'owner',

      // Maximum members per organization
      membershipLimit: 1000,

      // Invitation configuration
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: false, // Set to true in production

      // Send invitation email (configure email service)
      async sendInvitationEmail(data) {
        console.log('Sending invitation email:', {
          to: data.email,
          from: data.inviter.user.email,
          organization: data.organization.name,
          invitationId: data.id,
        });
        // TODO: Implement email sending logic
        // Example: await sendEmail({
        //   to: data.email,
        //   subject: `Invitation to join ${data.organization.name}`,
        //   body: `You've been invited to join ${data.organization.name}`,
        //   inviteLink: `${process.env.FRONTEND_URL}/accept-invitation/${data.id}`
        // });
      },

      // Organization hooks
      organizationHooks: {
        // Before creating organization
        async beforeCreateOrganization({ organization, user }) {
          console.log('Creating organization:', organization.name, 'by', user.email);
          return {
            data: {
              ...organization,
              metadata: {
                ...organization.metadata,
                createdBy: user.id,
                createdAt: new Date().toISOString(),
              },
            },
          };
        },

        // After creating organization
        async afterCreateOrganization({ organization, member, user }) {
          console.log('Organization created:', organization.name);
          // TODO: Setup default resources, send notifications, etc.
        },

        // Before adding member
        async beforeAddMember({ member, user, organization }) {
          console.log('Adding member:', user.email, 'to', organization.name);
          return { data: member };
        },

        // After adding member
        async afterAddMember({ member, user, organization }) {
          console.log('Member added:', user.email, 'to', organization.name);
          // TODO: Send welcome email, create default resources, etc.
        },

        // Before removing member
        async beforeRemoveMember({ member, user, organization }) {
          console.log('Removing member:', user.email, 'from', organization.name);
          // TODO: Cleanup user's resources
        },

        // After removing member
        async afterRemoveMember({ member, user, organization }) {
          console.log('Member removed:', user.email, 'from', organization.name);
        },
      },

      // Teams configuration (optional)
      teams: {
        enabled: true,
        maximumTeams: async ({ organizationId }) => {
          // Dynamic limit based on organization plan
          return 50;
        },
        allowRemovingAllTeams: false,
      },
    }),
  ],
});

export type Auth = typeof auth;
