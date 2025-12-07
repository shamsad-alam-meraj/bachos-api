import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Import model schemas (these are actually compiled models, we need to extract schemas)
import CouponModel from '../models/Coupon';
import DepositModel from '../models/Deposit';
import ExpenseModel from '../models/Expense';
import MealModel from '../models/Meal';
import MessModel from '../models/Mess';
import PlanModel from '../models/Plan';
import SubscriptionModel from '../models/Subscription';
import UserModel from '../models/User';

// Old model schemas (for reading existing data)
const OldUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  dateOfBirth: Date,
  profileImage: String,
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const OldMealSchema = new mongoose.Schema({
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  breakfast: { type: Number, default: 0 },
  lunch: { type: Number, default: 0 },
  dinner: { type: Number, default: 0 },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const OldMessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  address: String,
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mealRate: { type: Number, default: 50 },
  currency: { type: String, default: '৳' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const OldExpenseSchema = new mongoose.Schema({
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ['food', 'utilities', 'maintenance', 'other'],
    default: 'food',
  },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const OldDepositSchema = new mongoose.Schema({
  messId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

interface MigrationOptions {
  sourceUri: string;
  targetUri: string;
  batchSize?: number;
  dryRun?: boolean;
}

class DataMigration {
  private sourceConnection!: mongoose.Connection;
  private targetConnection!: mongoose.Connection;
  private options: MigrationOptions;

  constructor(options: MigrationOptions) {
    this.options = {
      batchSize: 100,
      dryRun: false,
      ...options,
    };
  }

  async connectDatabases() {
    try {
      // Connect to source database
      this.sourceConnection = await mongoose.createConnection(this.options.sourceUri);
      logger.info('Connected to source database');

      // Connect to target database
      this.targetConnection = await mongoose.createConnection(this.options.targetUri);
      logger.info('Connected to target database');

      // List all collections in source database
      if (this.sourceConnection.db) {
        const collections = await this.sourceConnection.db.listCollections().toArray();
        logger.info('Available collections in source database:');
        collections.forEach((col) => {
          logger.info(`  - ${col.name}`);
        });
      }

      // Register old models on source connection
      this.sourceConnection.model('OldUser', OldUserSchema);
      this.sourceConnection.model('OldMess', OldMessSchema);
      this.sourceConnection.model('OldMeal', OldMealSchema);
      this.sourceConnection.model('OldExpense', OldExpenseSchema);
      this.sourceConnection.model('OldDeposit', OldDepositSchema);

      // Create new models on target connection using the schema from imported models
      const User = this.targetConnection.model('User', UserModel.schema);
      const Mess = this.targetConnection.model('Mess', MessModel.schema);
      const Meal = this.targetConnection.model('Meal', MealModel.schema);
      const Expense = this.targetConnection.model('Expense', ExpenseModel.schema);
      const Deposit = this.targetConnection.model('Deposit', DepositModel.schema);
      const Plan = this.targetConnection.model('Plan', PlanModel.schema);
      const Coupon = this.targetConnection.model('Coupon', CouponModel.schema);
      const Subscription = this.targetConnection.model('Subscription', SubscriptionModel.schema);

      // Store models on the class instance
      (this as any).User = User;
      (this as any).Mess = Mess;
      (this as any).Meal = Meal;
      (this as any).Expense = Expense;
      (this as any).Deposit = Deposit;
      (this as any).Plan = Plan;
      (this as any).Coupon = Coupon;
      (this as any).Subscription = Subscription;
    } catch (error) {
      logger.error('Failed to connect to databases:', error);
      throw error;
    }
  }

  async migrateUsers() {
    logger.info('Starting user migration...');

    // Try different possible collection names
    const possibleNames = ['users', 'Users', 'user', 'User'];
    let users: any[] = [];
    let collectionName = '';

    for (const name of possibleNames) {
      try {
        const Model = this.sourceConnection.model('OldUser', OldUserSchema, name);
        users = await Model.find({}).lean();
        if (users.length > 0) {
          collectionName = name;
          break;
        }
      } catch (error) {
        // Continue to next name
      }
    }

    logger.info(`Found ${users.length} users to migrate from collection '${collectionName}'`);

    if (this.options.dryRun) {
      logger.info('DRY RUN: Would migrate users');
      return;
    }

    const batchSize = this.options.batchSize!;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const transformedUsers = batch.map((user) => ({
        ...user,
        isDeleted: false,
        preferences: {
          notifications: true,
          language: 'en',
          theme: 'light',
        },
      }));

      // Log sample transformed user for debugging
      if (i === 0) {
        logger.info('Sample transformed user:', JSON.stringify(transformedUsers[0], null, 2));
      }

      try {
        const result = await (this as any).User.insertMany(transformedUsers, { ordered: false });
        logger.info(
          `Migrated users batch ${Math.floor(i / batchSize) + 1}: ${result.length} users inserted`
        );
      } catch (insertError: any) {
        logger.error(
          `Failed to insert users batch ${Math.floor(i / batchSize) + 1}:`,
          insertError.message
        );
        // Log first few validation errors if any
        if (insertError.writeErrors) {
          insertError.writeErrors.slice(0, 3).forEach((err: any, idx: number) => {
            logger.error(`Validation error ${idx + 1}:`, err.err);
          });
        }
        throw insertError;
      }
    }

    logger.info('User migration completed');
  }

  async migrateMesses() {
    logger.info('Starting mess migration...');

    // Try different possible collection names
    const possibleNames = ['messes', 'Messes', 'mess', 'Mess'];
    let messes: any[] = [];
    let collectionName = '';

    for (const name of possibleNames) {
      try {
        const Model = this.sourceConnection.model('OldMess', OldMessSchema, name);
        messes = await Model.find({}).lean();
        if (messes.length > 0) {
          collectionName = name;
          break;
        }
      } catch (error) {
        // Continue to next name
      }
    }

    logger.info(`Found ${messes.length} messes to migrate from collection '${collectionName}'`);

    if (this.options.dryRun) {
      logger.info('DRY RUN: Would migrate messes');
      return;
    }

    await (this as any).Mess.insertMany(messes);
    logger.info('Mess migration completed');
  }

  async migrateMeals() {
    logger.info('Starting meal migration...');

    // Try different possible collection names
    const possibleNames = ['meals', 'Meals', 'meal', 'Meal'];
    let meals: any[] = [];
    let collectionName = '';

    for (const name of possibleNames) {
      try {
        const Model = this.sourceConnection.model('OldMeal', OldMealSchema, name);
        meals = await Model.find({}).lean();
        if (meals.length > 0) {
          collectionName = name;
          break;
        }
      } catch (error) {
        // Continue to next name
      }
    }

    logger.info(`Found ${meals.length} meals to migrate from collection '${collectionName}'`);

    if (this.options.dryRun) {
      logger.info('DRY RUN: Would migrate meals');
      return;
    }

    const batchSize = this.options.batchSize!;
    for (let i = 0; i < meals.length; i += batchSize) {
      const batch = meals.slice(i, i + batchSize);

      const transformedMeals = batch.map((meal) => ({
        ...meal,
        status: 'taken', // Default status for existing meals
        isGuest: false,
        mealType: 'regular',
        preferences: {},
        cost: 0, // Will be calculated later if needed
      }));

      await (this as any).Meal.insertMany(transformedMeals);
      logger.info(`Migrated meals batch ${Math.floor(i / batchSize) + 1}`);
    }

    logger.info('Meal migration completed');
  }

  async migrateExpenses() {
    logger.info('Starting expense migration...');

    // Try different possible collection names
    const possibleNames = ['expenses', 'Expenses', 'expense', 'Expense'];
    let expenses: any[] = [];
    let collectionName = '';

    for (const name of possibleNames) {
      try {
        const Model = this.sourceConnection.model('OldExpense', OldExpenseSchema, name);
        expenses = await Model.find({}).lean();
        if (expenses.length > 0) {
          collectionName = name;
          break;
        }
      } catch (error) {
        // Continue to next name
      }
    }

    logger.info(`Found ${expenses.length} expenses to migrate from collection '${collectionName}'`);

    if (this.options.dryRun) {
      logger.info('DRY RUN: Would migrate expenses');
      return;
    }

    await (this as any).Expense.insertMany(expenses);
    logger.info('Expense migration completed');
  }

  async migrateDeposits() {
    logger.info('Starting deposit migration...');

    // Try different possible collection names
    const possibleNames = ['deposits', 'Deposits', 'deposit', 'Deposit'];
    let deposits: any[] = [];
    let collectionName = '';

    for (const name of possibleNames) {
      try {
        const Model = this.sourceConnection.model('OldDeposit', OldDepositSchema, name);
        deposits = await Model.find({}).lean();
        if (deposits.length > 0) {
          collectionName = name;
          break;
        }
      } catch (error) {
        // Continue to next name
      }
    }

    logger.info(`Found ${deposits.length} deposits to migrate from collection '${collectionName}'`);

    if (this.options.dryRun) {
      logger.info('DRY RUN: Would migrate deposits');
      return;
    }

    await (this as any).Deposit.insertMany(deposits);
    logger.info('Deposit migration completed');
  }

  async createDefaultPlans() {
    logger.info('Creating default subscription plans...');

    if (this.options.dryRun) {
      logger.info('DRY RUN: Would create default plans');
      return;
    }

    // Get admin user for createdBy field
    const adminUser = await (this as any).User.findOne({ role: 'admin' });
    if (!adminUser) {
      logger.warn('No admin user found, skipping plan creation');
      return;
    }

    const plans = [
      {
        name: 'Basic Plan',
        description: 'Perfect for small messes with up to 5 members',
        maxMembers: 5,
        planType: 'monthly',
        duration: 1,
        price: 0,
        currency: 'BDT',
        features: ['Basic meal tracking', 'Expense management', 'Monthly reports', 'Email support'],
        createdBy: adminUser._id,
      },
      {
        name: 'Standard Plan',
        description: 'Ideal for medium messes with up to 15 members',
        maxMembers: 15,
        planType: 'monthly',
        duration: 1,
        price: 100,
        currency: 'BDT',
        features: [
          'Advanced meal tracking',
          'Expense management',
          'Monthly & yearly reports',
          'Priority support',
          'Guest meal management',
        ],
        createdBy: adminUser._id,
      },
      {
        name: 'Premium Plan',
        description: 'For large messes with unlimited members',
        maxMembers: 100,
        planType: 'monthly',
        duration: 1,
        price: 200,
        currency: 'BDT',
        features: [
          'All Standard features',
          'AI-powered insights',
          'Advanced analytics',
          'Custom reports',
          '24/7 support',
          'API access',
        ],
        createdBy: adminUser._id,
      },
    ];

    await (this as any).Plan.insertMany(plans);
    logger.info('Default plans created');
  }

  async createDefaultCoupons() {
    logger.info('Creating default coupons...');

    if (this.options.dryRun) {
      logger.info('DRY RUN: Would create default coupons');
      return;
    }

    const adminUser = await (this as any).User.findOne({ role: 'admin' });
    if (!adminUser) {
      logger.warn('No admin user found, skipping coupon creation');
      return;
    }

    const coupons = [
      {
        code: 'WELCOME10',
        description: '10% off for new customers',
        discountType: 'percentage',
        discountValue: 10,
        maxUses: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        applicablePlans: [],
        createdBy: adminUser._id,
      },
      {
        code: 'SAVE500',
        description: 'Fixed discount of 500 BDT',
        discountType: 'fixed',
        discountValue: 500,
        maxUses: 50,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        applicablePlans: [],
        createdBy: adminUser._id,
      },
    ];

    await (this as any).Coupon.insertMany(coupons);
    logger.info('Default coupons created');
  }

  async runMigration() {
    try {
      logger.info('Starting data migration...');
      logger.info(`Source DB: ${this.options.sourceUri}`);
      logger.info(`Target DB: ${this.options.targetUri}`);
      logger.info(`Dry Run: ${this.options.dryRun ? 'YES' : 'NO'}`);

      await this.connectDatabases();

      // Run migrations in order
      await this.migrateUsers();
      await this.migrateMesses();
      await this.migrateMeals();
      await this.migrateExpenses();
      await this.migrateDeposits();

      // Create new data
      await this.createDefaultPlans();
      await this.createDefaultCoupons();

      logger.info('Data migration completed successfully!');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    } finally {
      // Close connections
      if (this.sourceConnection) {
        await this.sourceConnection.close();
      }
      if (this.targetConnection) {
        await this.targetConnection.close();
      }
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npm run migrate <source-db-uri> <target-db-uri> [--dry-run]');
  }

  const [sourceUri, targetUri] = args;
  const dryRun = args.includes('--dry-run');

  const migration = new DataMigration({
    sourceUri,
    targetUri,
    dryRun,
    batchSize: 100,
  });

  try {
    await migration.runMigration();
    logger.info('Migration script completed successfully');
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  }
}

// Export for testing
export { DataMigration };

// Run if called directly
if (require.main === module) {
  main();
}
