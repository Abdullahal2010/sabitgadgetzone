export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  buyPrice?: number;
  imageUrl: string;
  stock: number;
  category?: string;
  sold?: number;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt?: string;
}

export interface Review {
  _id: string;
  orderId: string;
  productId: string;
  userPhone: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  _id: string;
  userPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentProvider?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentTransactionId?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  paymentFee?: number;
  customerEmail?: string;
  createdAt: string;
}

export type Role = 'user' | 'moderator' | 'admin';

export interface ModeratorPermissions {
  addProducts: boolean;
  editProducts: boolean;
  deleteProducts: boolean;
  viewOrders: boolean;
  changeOrderStatus: boolean;
}

export interface UserRestrictions {
  canShop: boolean;
  canReview: boolean;
}

export interface AppUser {
  _id: string;
  phone: string;
  name: string;
  dob?: string;
  gender?: 'male' | 'female';
  address?: string;
  email?: string;
  walletBalance: number;
  createdAt?: string;
  role: Role;
  banned?: boolean;
  banReason?: string;
  restrictions?: UserRestrictions;
  moderatorPermissions?: ModeratorPermissions;
}

export type NotificationType =
  | 'welcome'
  | 'role_change'
  | 'banned'
  | 'unbanned'
  | 'restriction_change'
  | 'order_placed'
  | 'order_confirmed'
  | 'order_status_change';

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
