export type Currency = 
  | 'GBP' 
  | 'USD' 
  | 'AUD' 
  | 'NZD' 
  | 'EUR' 
  | 'CHF' 
  | 'ZAR' 
  | 'ZWG' 
  | 'CNY' 
  | 'AED';

export type StoreId = 'OK_ZIM' | 'TM_PNP' | 'SA_WHOLESALE' | 'SPAR_ZIM' | 'CHOPPIES';

export type FulfillmentTag = 
  | 'Harare Express' 
  | 'Bulawayo Click & Collect' 
  | 'SA Export to Zim' 
  | 'Mutare Depot' 
  | 'Nationwide Zim';

export type ProductCategory = 
  | 'Maize & Staples' 
  | 'Cooking & Oils' 
  | 'Meats & Proteins' 
  | 'Dairy & Fresh' 
  | 'Beverages & Tea' 
  | 'Solar & Power' 
  | 'Household & Soap' 
  | 'Baby & Care';

export interface Product {
  id: string;
  name: string;
  nativeName?: string; // e.g., "Hupfu hweSona / Impuphu"
  brand: string;
  category: ProductCategory;
  storeId: StoreId;
  storeName: string;
  priceUSD: number;
  priceZAR: number;
  priceZWG: number;
  image: string;
  unit: string;
  fulfillmentTag: FulfillmentTag;
  inStock: boolean;
  featured?: boolean;
}

export type DeliveryType = 'DOOR_DELIVERY' | 'STORE_PICKUP';

export interface DeliveryAddress {
  type: DeliveryType;
  addressLine: string;
  suburb?: string;
  city: string;
  country: string;
  instructions?: string;
  lat?: number;
  lng?: number;
  storeId?: StoreId;
  storeName?: string;
}

export interface Member {
  id: string;
  name: string;
  location: string; // e.g., "Johannesburg, SA", "Harare, ZIM", "Bulawayo, ZIM"
  avatar: string;
  role: 'Sponsor / Diaspora' | 'Recipient' | 'Contributor' | 'Elder';
  channel: 'web' | 'whatsapp';
  isOnline: boolean;
  color: string;
  phone?: string;
  deliveryAddress?: DeliveryAddress;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  addedByMemberId: string;
  addedByMemberName: string;
  addedByLocation: string;
  channel: 'web' | 'whatsapp';
  addedAt: string;
  note?: string;
  deliveryAddress?: DeliveryAddress;
}

export type SplitMethod = 'EQUAL' | 'BY_SUBMITTER' | 'CUSTOM';

export interface MemberSplitShare {
  memberId: string;
  memberName: string;
  subtotalUSD: number;
  shareUSD: number;
  percentage: number;
}

export interface WhatsAppMessage {
  id: string;
  fromPhone: string;
  senderName: string;
  text: string;
  isVoiceNote?: boolean;
  audioUrl?: string;
  timestamp: string;
  status: 'sent' | 'received' | 'processed' | 'failed';
  parsedIntent?: {
    action: 'ADD' | 'REMOVE' | 'QUERY' | 'CHECKOUT' | 'UNKNOWN';
    items?: { productName: string; qty: number }[];
    spokenResponse?: string;
    detectedLanguage?: string;
  };
  replyText?: string;
}

export interface VoiceAIResult {
  action: 'ADD' | 'REMOVE' | 'QUERY' | 'CHECKOUT' | 'UNKNOWN';
  items: {
    productName: string;
    qty: number;
    matchedProductId?: string;
  }[];
  spokenResponse: string;
  detectedLanguage: string;
  confidence: number;
  originalText?: string;
}

export interface ExchangeRates {
  USD_ZAR: number;
  USD_ZWG: number;
  USD_EUR: number;
  USD_GBP: number;
  USD_AUD: number;
  lastUpdated: string;
}

// ── PicknPay / Moja Integration ─────────────────────────────────────────────
// ZWG is the official ISO code for ZiG (Zimbabwe Gold) — reused rather than
// introducing a second code for the same currency.

export type WalletCurrency = 'ZWG' | 'USD' | 'ZAR' | 'EUR' | 'GBP' | 'AUD';

export type WalletBalances = Record<WalletCurrency, number>;

// Closed-loop store credit — intentionally NOT the same shape/table as the
// open wallet. Only ZWG/USD per the TM Pick n Pay requirement that inbound
// remittance value never behaves like an open-ended financial wallet.
export type VoucherCurrency = 'ZWG' | 'USD';
export type VoucherBalances = Record<VoucherCurrency, number>;

export type RemittanceSource = 'ECOCASH' | 'MUKURU' | 'INNBUCKS' | 'OMARI';

export interface RemittanceTransaction {
  id: string;
  source: RemittanceSource;
  recipientPhone: string;
  amount: number;
  currency: VoucherCurrency;
  reference: string;
  status: 'PENDING' | 'CREDITED' | 'REJECTED';
  receivedAt: string;
}

export type EcoCashDirection = 'ONRAMP' | 'OFFRAMP';

export interface EcoCashTransaction {
  id: string;
  direction: EcoCashDirection;
  phone: string;
  amount: number;
  currency: VoucherCurrency;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  reference: string;
  createdAt: string;
}

export type B2BAccountType = 'SCHOOL' | 'CORPORATE' | 'LODGE' | 'VENDOR';

export interface B2BAccount {
  id: string;
  name: string;
  type: B2BAccountType;
  phone: string;
  city: string;
  defaultFulfillment: 'STORE' | 'HUB';
  dailyBatchAllocationId?: string;
}

export type OrderTrackingStatus = 'ORDERED' | 'PACKED' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export type FulfillmentRoute = 'STORE' | 'HUB';

export type DeliveryCapability = 'SCOOTER' | 'TRUCK' | 'TRUCK_BULK_DROP' | 'THIRD_PARTY_VENDOR';

export interface DeliveryZone {
  zoneId: string;
  label: string;
  city: string;
  capabilities: DeliveryCapability[];
}

export interface ERPStockLevel {
  storeId: StoreId;
  sku: string;
  liveQty: number;
  lowStockThreshold: number;
  erpSource: 'SAP' | 'ARCH_RETAIL' | 'SYSPRO' | 'MOCK';
  lastSyncedAt: string;
}

export type PaymentRail = 'CONTIPAY' | 'PESAPAL' | 'COINBASE_USDC';

export interface CardDetails {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingCountry: string;
  postalCode?: string;
}

export interface OrchestrationAttempt {
  rail: PaymentRail;
  latencyMs: number;
  error?: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
}

export interface OrchestrationResponse {
  success: boolean;
  orderId: string;
  voucherCode: string;
  finalRail?: PaymentRail;
  transactionReference?: string;
  settlementAccount?: string;
  forexReportingCode?: string;
  totalLatencyMs: number;
  attempts: OrchestrationAttempt[];
  userMessage: string;
  itemsCount: number;
  totalUSD: number;
  deliverySummary?: {
    memberName: string;
    destination: string;
    type: DeliveryType;
  }[];
  timestamp: string;
}

export interface PaymentOrchestratorLog {
  id: string;
  timestamp: string;
  orderId: string;
  amountUSD: number;
  billingCountry: string;
  cardLast4: string;
  status: 'SETTLED' | 'FAILED';
  finalRail?: PaymentRail;
  attempts: OrchestrationAttempt[];
  nostroAccount?: string;
  forexCode?: string;
  totalLatencyMs: number;
}
