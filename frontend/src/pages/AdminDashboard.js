import AdminLayout from '../components/admin/layout/AdminLayout';
import OverviewTab from '../components/admin/tabs/OverviewTab';
import KycReviewTab from '../components/admin/tabs/KycReviewTab';
import ForumTab from '../components/admin/tabs/ForumTab';
import RecipesTab from '../components/admin/tabs/RecipesTab';
import SettingsTab from '../components/admin/tabs/SettingsTab';
import MessagesTab from '../components/admin/tabs/MessagesTab';
import ModerationTab from '../components/admin/tabs/ModerationTab';
import PaymentsTab from '../components/admin/tabs/PaymentsTab';
import AnalyticsTab from '../components/admin/tabs/AnalyticsTab'; // NEW IMPORT

const tabs = [
  { label: 'Overview', icon: 'Dashboard', component: <OverviewTab /> },
  { label: 'Analytics', icon: 'Assessment', component: <AnalyticsTab /> }, // UPDATED: Added AnalyticsTab
  { label: 'Payments', icon: 'Payments', component: <PaymentsTab /> },
  { label: 'KYC Review', icon: 'LocalShipping', component: <KycReviewTab /> },
  { label: 'Recipes', icon: 'RestaurantMenu', component: <RecipesTab /> },
  { label: 'Forum', icon: 'Forum', component: <ForumTab /> },
  { label: 'Settings', icon: 'Settings', component: <SettingsTab /> },
  { label: 'Messages', icon: 'Message', component: <MessagesTab /> },
  { label: 'Moderation', icon: 'Security', component: <ModerationTab /> }, 
];

const AdminDashboard = () => {
  return <AdminLayout tabs={tabs} title="Admin Dashboard" />;
};

export default AdminDashboard;