-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('STUDENT', 'TEACHER', 'INSTITUTION', 'ENTERPRISE', 'FREEMIUM');

-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "public"."FeatureCategory" AS ENUM ('CORE', 'ANALYTICS', 'INTEGRATIONS', 'SUPPORT', 'STORAGE', 'USERS', 'CONTENT', 'EXAMS');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CRYPTO', 'CASH');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'SQUARE', 'BRAINTREE', 'RAZORPAY', 'PAYU', 'MOMO', 'ZALO_PAY', 'VIETQR');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."LineItemType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME', 'DISCOUNT', 'TAX', 'FEE');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'CHARGEBACK', 'ADJUSTMENT', 'FEE');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REQUIRES_ACTION');

-- CreateEnum
CREATE TYPE "public"."RefundReason" AS ENUM ('REQUESTED_BY_CUSTOMER', 'DUPLICATE', 'FRAUDULENT', 'SUBSCRIPTION_CANCELED', 'PRODUCT_UNACCEPTABLE', 'NO_LONGER_AVAILABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_TRIAL', 'FREE_MONTHS');

-- CreateEnum
CREATE TYPE "public"."TaxType" AS ENUM ('SALES_TAX', 'VAT', 'GST', 'SERVICE_TAX');

-- CreateTable
CREATE TABLE "public"."subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."PlanType" NOT NULL,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" MONEY NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" "public"."BillingCycle" NOT NULL,
    "features" JSONB NOT NULL,
    "maxStudents" INTEGER,
    "maxCourses" INTEGER,
    "maxStorage" INTEGER,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isPromo" BOOLEAN NOT NULL DEFAULT false,
    "promoCode" TEXT,
    "discountPercentage" DECIMAL(5,2),
    "promoValidUntil" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plan_features" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."FeatureCategory" NOT NULL,
    "value" TEXT,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "isTrialing" BOOLEAN NOT NULL DEFAULT false,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "studentsUsed" INTEGER NOT NULL DEFAULT 0,
    "coursesUsed" INTEGER NOT NULL DEFAULT 0,
    "storageUsed" INTEGER NOT NULL DEFAULT 0,
    "nextBillingDate" TIMESTAMP(3),
    "lastBillingDate" TIMESTAMP(3),
    "paymentMethodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."PaymentType" NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "bankName" TEXT,
    "accountLast4" TEXT,
    "walletType" TEXT,
    "providerId" TEXT NOT NULL,
    "providerPaymentMethodId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "billingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "description" TEXT NOT NULL,
    "subtotal" MONEY NOT NULL,
    "taxAmount" MONEY NOT NULL DEFAULT 0,
    "discountAmount" MONEY NOT NULL DEFAULT 0,
    "total" MONEY NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "public"."InvoiceStatus" NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "paymentMethodId" TEXT,
    "pdfUrl" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "dunningLevel" INTEGER NOT NULL DEFAULT 0,
    "lastDunningAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" MONEY NOT NULL,
    "amount" MONEY NOT NULL,
    "itemType" "public"."LineItemType" NOT NULL,
    "itemId" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "paymentMethodId" TEXT,
    "type" "public"."TransactionType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL,
    "amount" MONEY NOT NULL,
    "feeAmount" MONEY NOT NULL DEFAULT 0,
    "netAmount" MONEY NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" "public"."PaymentProvider" NOT NULL,
    "providerId" TEXT,
    "description" TEXT,
    "processedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" MONEY NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" "public"."RefundReason" NOT NULL,
    "description" TEXT,
    "status" "public"."RefundStatus" NOT NULL,
    "providerId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_records" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "unit" TEXT,
    "recordDate" DATE NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "unitPrice" MONEY,
    "totalCost" MONEY,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "currency" TEXT,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "planIds" JSONB,
    "minAmount" MONEY,
    "newCustomersOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discount_applications" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    "discountAmount" MONEY NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_rates" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "region" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "taxType" "public"."TaxType" NOT NULL DEFAULT 'SALES_TAX',
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_webhooks" (
    "id" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "grossRevenue" MONEY NOT NULL DEFAULT 0,
    "netRevenue" MONEY NOT NULL DEFAULT 0,
    "refundAmount" MONEY NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "successfulTransactions" INTEGER NOT NULL DEFAULT 0,
    "failedTransactions" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "churnedCustomers" INTEGER NOT NULL DEFAULT 0,
    "activeSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "planMetrics" JSONB,
    "countryMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_plans_type_idx" ON "public"."subscription_plans"("type");

-- CreateIndex
CREATE INDEX "subscription_plans_status_idx" ON "public"."subscription_plans"("status");

-- CreateIndex
CREATE INDEX "subscription_plans_isVisible_idx" ON "public"."subscription_plans"("isVisible");

-- CreateIndex
CREATE INDEX "plan_features_planId_idx" ON "public"."plan_features"("planId");

-- CreateIndex
CREATE INDEX "plan_features_category_idx" ON "public"."plan_features"("category");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "public"."subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "public"."subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_nextBillingDate_idx" ON "public"."subscriptions"("nextBillingDate");

-- CreateIndex
CREATE INDEX "payment_methods_userId_idx" ON "public"."payment_methods"("userId");

-- CreateIndex
CREATE INDEX "payment_methods_type_idx" ON "public"."payment_methods"("type");

-- CreateIndex
CREATE INDEX "payment_methods_provider_idx" ON "public"."payment_methods"("provider");

-- CreateIndex
CREATE INDEX "payment_methods_isDefault_idx" ON "public"."payment_methods"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "public"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "public"."invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "public"."invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "public"."invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "public"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoiceId_idx" ON "public"."invoice_line_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_line_items_itemType_idx" ON "public"."invoice_line_items"("itemType");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "public"."transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "public"."transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_invoiceId_idx" ON "public"."transactions"("invoiceId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "public"."transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "public"."transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_reference_idx" ON "public"."transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_refundNumber_key" ON "public"."refunds"("refundNumber");

-- CreateIndex
CREATE INDEX "refunds_transactionId_idx" ON "public"."refunds"("transactionId");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "public"."refunds"("status");

-- CreateIndex
CREATE INDEX "refunds_refundNumber_idx" ON "public"."refunds"("refundNumber");

-- CreateIndex
CREATE INDEX "usage_records_subscriptionId_idx" ON "public"."usage_records"("subscriptionId");

-- CreateIndex
CREATE INDEX "usage_records_metricName_idx" ON "public"."usage_records"("metricName");

-- CreateIndex
CREATE INDEX "usage_records_recordDate_idx" ON "public"."usage_records"("recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_subscriptionId_metricName_recordDate_key" ON "public"."usage_records"("subscriptionId", "metricName", "recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "public"."discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_code_idx" ON "public"."discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_isActive_idx" ON "public"."discount_codes"("isActive");

-- CreateIndex
CREATE INDEX "discount_codes_validFrom_idx" ON "public"."discount_codes"("validFrom");

-- CreateIndex
CREATE INDEX "discount_codes_validUntil_idx" ON "public"."discount_codes"("validUntil");

-- CreateIndex
CREATE INDEX "discount_applications_discountId_idx" ON "public"."discount_applications"("discountId");

-- CreateIndex
CREATE INDEX "discount_applications_userId_idx" ON "public"."discount_applications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "discount_applications_discountId_userId_invoiceId_key" ON "public"."discount_applications"("discountId", "userId", "invoiceId");

-- CreateIndex
CREATE INDEX "tax_rates_country_idx" ON "public"."tax_rates"("country");

-- CreateIndex
CREATE INDEX "tax_rates_isActive_idx" ON "public"."tax_rates"("isActive");

-- CreateIndex
CREATE INDEX "payment_webhooks_provider_idx" ON "public"."payment_webhooks"("provider");

-- CreateIndex
CREATE INDEX "payment_webhooks_eventType_idx" ON "public"."payment_webhooks"("eventType");

-- CreateIndex
CREATE INDEX "payment_webhooks_processed_idx" ON "public"."payment_webhooks"("processed");

-- CreateIndex
CREATE INDEX "payment_analytics_date_idx" ON "public"."payment_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "payment_analytics_date_key" ON "public"."payment_analytics"("date");

-- AddForeignKey
ALTER TABLE "public"."plan_features" ADD CONSTRAINT "plan_features_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_records" ADD CONSTRAINT "usage_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discount_applications" ADD CONSTRAINT "discount_applications_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."discount_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
