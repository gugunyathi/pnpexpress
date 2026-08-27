import mongoose, { Schema, Document, Model } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gugu_db_user:vP3zMxkL06t6SJCO@cluster0.stao0rj.mongodb.net/pnpexpress?retryWrites=true&w=majority';

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'pnpexpress'
    });
    console.log('[MongoDB] Connected successfully to Atlas database: pnpexpress');
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
  }
}

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: string;
  walletAddress?: string;
  cdpProjectId?: string;
  phone?: string;
  country?: string;
  city?: string;
  currencyPreference?: string;
  lowDataPreference?: boolean;
  walletBalanceUSD: number;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface IActivityLog extends Document {
  userId: string;
  userEmail?: string;
  action: string;
  details?: any;
  ip?: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  orderId: string;
  invoiceNumber: string;
  userId?: string;
  date?: string;
  timestamp: Date;
  status: string;
  statusLabel?: string;
  statusColor?: string;
  storePartner?: string;
  fulfillmentType: string;
  fulfillmentLocation?: string;
  recipientName?: string;
  recipientPhone?: string;
  collectionCode?: string;
  paymentMethod?: any;
  subtotalUSD: number;
  deliveryFeeUSD: number;
  vatTaxUSD: number;
  totalUSD: number;
  items: any[];
  trackingSteps: any[];
}

export interface ICDPWallet extends Document {
  userId: string;
  userEmail: string;
  address: string;
  projectId?: string;
  network: string;
  paymasterUrl?: string;
  balanceEth: number;
  balanceUsdc: number;
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  password: { type: String, required: false },
  role: { type: String, default: 'Sponsor / Diaspora' },
  walletAddress: { type: String },
  cdpProjectId: { type: String, default: process.env.VITE_CDP_PROJECT_ID },
  phone: { type: String },
  country: { type: String, default: 'United Kingdom' },
  city: { type: String, default: 'London' },
  currencyPreference: { type: String, default: 'GBP' },
  lowDataPreference: { type: Boolean, default: false },
  walletBalanceUSD: { type: Number, default: 245.00 },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now }
});

// User Session / Activity Log Schema
const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Order Schema
const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  invoiceNumber: { type: String, required: true },
  userId: { type: String },
  date: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'PROCESSING' },
  statusLabel: { type: String },
  statusColor: { type: String, default: 'blue' },
  storePartner: { type: String },
  fulfillmentType: { type: String, default: 'DOOR_DELIVERY' },
  fulfillmentLocation: { type: String },
  recipientName: { type: String },
  recipientPhone: { type: String },
  collectionCode: { type: String },
  paymentMethod: {
    type: { type: String },
    label: { type: String },
    details: { type: String },
    authRef: { type: String }
  },
  subtotalUSD: { type: Number, required: true },
  deliveryFeeUSD: { type: Number, default: 3.50 },
  vatTaxUSD: { type: Number, default: 0.00 },
  totalUSD: { type: Number, required: true },
  items: [],
  trackingSteps: []
});

// CDP Wallet Schema
const CDPWalletSchema = new Schema<ICDPWallet>({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  address: { type: String, required: true, unique: true },
  projectId: { type: String, default: process.env.VITE_CDP_PROJECT_ID },
  network: { type: String, default: 'base-sepolia' },
  paymasterUrl: { type: String, default: process.env.CDP_PAYMASTER_URL_TESTNET },
  balanceEth: { type: Number, default: 0.05 },
  balanceUsdc: { type: Number, default: 500.00 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export const ActivityLog: Model<IActivityLog> = (mongoose.models.ActivityLog as Model<IActivityLog>) || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export const OrderModel: Model<IOrder> = (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);
export const CDPWallet: Model<ICDPWallet> = (mongoose.models.CDPWallet as Model<ICDPWallet>) || mongoose.model<ICDPWallet>('CDPWallet', CDPWalletSchema);
