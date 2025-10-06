import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard, AuthPermissionGuard, OrganizationContext, PermissionGuard, RequirePermissions } from '@anineplus/authorization';

/**
 * Example resolver demonstrating permission guard usage
 * This is a reference implementation - adapt for your actual resources
 */

// Example DTOs (you'll have your own)
class Anime {
  id: string;
  title: string;
  description: string;
}

class CreateAnimeInput {
  title: string;
  description: string;
}

@Resolver()
export class AnimeExampleResolver {
  // ============ Public Access ============
  
  /**
   * No guard - anyone can access
   */
  @Query(() => [Anime])
  async listPublicAnime() {
    return []; // Your implementation
  }

  // ============ Authentication Only ============

  /**
   * Requires authentication but no specific permissions
   */
  @Query(() => Anime)
  @UseGuards(AuthGuard)
  async getAnimeDetails(
    @Args('id') id: string,
    @Context() context: any,
  ) {
    // context.user is available here
    return {} as Anime; // Your implementation
  }

  // ============ Permission-based Access ============

  /**
   * Method 1: Using separate guards
   * Requires authentication + specific permission
   */
  @Mutation(() => Anime)
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions({
    anime: ['create']
  })
  async createAnimeV1(
    @Args('input') input: CreateAnimeInput,
    @Args('organizationId') organizationId: string,
    @Context() context: any,
  ) {
    return {} as Anime; // Your implementation
  }

  /**
   * Method 2: Using combined guard (RECOMMENDED)
   * Same result but cleaner code
   */
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['create']
  })
  async createAnime(
    @Args('input') input: CreateAnimeInput,
    @Args('organizationId') organizationId: string,
    @Context() context: any,
  ) {
    return {} as Anime; // Your implementation
  }

  /**
   * Requires multiple actions on same resource
   * User must have ALL specified permissions
   */
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['update', 'publish']
  })
  async updateAndPublishAnime(
    @Args('id') id: string,
    @Args('input') input: CreateAnimeInput,
    @Args('organizationId') organizationId: string,
  ) {
    return {} as Anime; // Your implementation
  }

  /**
   * Requires permissions on multiple resources
   */
  @Mutation(() => Boolean)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['delete'],
    episode: ['delete']
  })
  async deleteAnimeAndEpisodes(
    @Args('animeId') animeId: string,
    @Args('organizationId') organizationId: string,
  ) {
    return true; // Your implementation
  }

  // ============ Custom Organization Context ============

  /**
   * When organizationId is in input object
   * Guard will automatically find it
   */
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['update']
  })
  async updateAnimeWithInputOrg(
    @Args('id') id: string,
    @Args('input') input: { 
      organizationId: string; 
      title: string; 
    },
  ) {
    return {} as Anime;
  }

  /**
   * When organizationId has a different name
   */
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['create']
  })
  @OrganizationContext('orgId') // Tell guard to look for 'orgId'
  async createAnimeCustomParam(
    @Args('input') input: CreateAnimeInput,
    @Args('orgId') orgId: string, // Different parameter name
  ) {
    return {} as Anime;
  }

  // ============ Role-specific Examples ============

  /**
   * Content Manager can do this
   * Requires: anime.create, anime.update, analytics.read
   */
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['create', 'update'],
    analytics: ['read']
  })
  async createAnimeWithAnalytics(
    @Args('input') input: CreateAnimeInput,
    @Args('organizationId') organizationId: string,
  ) {
    return {} as Anime;
  }

  /**
   * Moderator can do this
   * Requires: anime.read, comment.moderate
   */
  @Query(() => [Anime])
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['read'],
    comment: ['moderate']
  })
  async getAnimeWithCommentModeration(
    @Args('organizationId') organizationId: string,
  ) {
    return [] as Anime[];
  }

  /**
   * Admin/Owner only
   * Requires: settings.update, user.update
   */
  @Mutation(() => Boolean)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    settings: ['update'],
    user: ['update']
  })
  async updateSystemSettings(
    @Args('organizationId') organizationId: string,
  ) {
    return true;
  }
}
