import AdminLayout from '../components/admin/layout/AdminLayout';
import OverviewTab from '../components/admin/tabs/OverviewTab';
import UsersTab from '../components/admin/tabs/UsersTab'; // NEW
import OrdersTab from '../components/admin/tabs/OrdersTab'; // NEW
import KycReviewTab from '../components/admin/tabs/KycReviewTab';
import ForumTab from '../components/admin/tabs/ForumTab';
import RecipesTab from '../components/admin/tabs/RecipesTab';
import SettingsTab from '../components/admin/tabs/SettingsTab';
import MessagesTab from '../components/admin/tabs/MessagesTab';
import ModerationTab from '../components/admin/tabs/ModerationTab';
import PaymentsTab from '../components/admin/tabs/PaymentsTab';
import AnalyticsTab from '../components/admin/tabs/AnalyticsTab';
import DeliveryKYCApproval from '../components/admin/DeliveryKYCApproval';
import PendingProductsTab from '../components/admin/tabs/PendingProductsTab';

import AdminReportsPanel from '../components/admin/AdminReportsPanel';
import AdminSupportDashboard from '../components/admin/AdminSupportDashboard';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';

const tabs = [
  { label: 'Overview', icon: 'Dashboard', component: <OverviewTab /> },
  { label: 'Support Tickets', icon: 'SupportAgent', component: <AdminSupportDashboard /> },
  { label: 'Users', icon: 'People', component: <UsersTab /> }, // NEW
  { label: 'Orders', icon: 'ShoppingCart', component: <OrdersTab /> }, // NEW
  { label: 'Pending Products', icon: 'Inventory', component: <PendingProductsTab /> },
  { label: 'Analytics', icon: 'Assessment', component: <AnalyticsTab /> },
  { label: 'Payments', icon: 'Payments', component: <PaymentsTab /> },
  { label: 'Referral Withdrawals', icon: 'AccountBalanceWallet', component: <WithdrawalManagement /> },
  { label: 'KYC Review', icon: 'LocalShipping', component: <KycReviewTab /> },
  { label: 'Delivery KYC', icon: 'DeliveryDining', component: <DeliveryKYCApproval /> },
  { label: 'Recipes', icon: 'RestaurantMenu', component: <RecipesTab /> },
  { label: 'Forum', icon: 'Forum', component: <ForumTab /> },
  { label: 'Post Reports', icon: 'Report', component: <AdminReportsPanel /> },
  { label: 'Settings', icon: 'Settings', component: <SettingsTab /> },
  { label: 'Messages', icon: 'Message', component: <MessagesTab /> },
  { label: 'Moderation', icon: 'Security', component: <ModerationTab /> },
];

const AdminDashboard = () => {
  return <AdminLayout tabs={tabs} title="Admin Dashboard" />;
};

export default AdminDashboard;