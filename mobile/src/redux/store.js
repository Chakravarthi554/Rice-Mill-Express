import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import { productListReducer, productDetailsReducer, productCreateReviewReducer } from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';
import {
  bulkOrderListReducer,
  bulkOrderCreateReducer,
  bulkOrderUpdateReducer,
  bulkOrderDetailsReducer
} from './reducers/bulkOrderReducers';
import { recipeListReducer, recipeDetailsReducer } from './reducers/recipeReducers';
import {
  forumPostListReducer,
  forumPostDetailsReducer,
  forumPostCreateReducer
} from './reducers/forumReducers';
import {
  rewardsReducer,
  rewardTransactionsReducer,
  redeemRewardReducer,
  campaignsReducer,
  publicSettingsReducer
} from './reducers/rewardsReducers';
import {
  userReviewsReducer,
  deleteReviewReducer,
  updateReviewReducer
} from './reducers/reviewReducers';
import {
  refundCreateReducer,
  refundListReducer,
  refundDetailsReducer
} from './reducers/refundReducers';
import {
  referralReducer,
  referralCodeReducer,
  subscriptionListReducer,
  subscriptionCreateReducer
} from './reducers/referralReducers';
import {
  walletReducer,
  withdrawalReducer,
  withdrawalHistoryReducer
} from './reducers/walletReducers';
import { wishlistReducer } from './reducers/wishlistReducers';
import { addressListReducer } from './reducers/addressReducers';

const combinedReducer = combineReducers({
  auth: authReducer,
  productList: productListReducer,
  productDetails: productDetailsReducer,
  productCreateReview: productCreateReviewReducer,
  cart: cartReducer,
  addressList: addressListReducer,
  bulkOrderList: bulkOrderListReducer,
  bulkOrderCreate: bulkOrderCreateReducer,
  bulkOrderUpdate: bulkOrderUpdateReducer,
  bulkOrderDetails: bulkOrderDetailsReducer,
  recipeList: recipeListReducer,
  recipeDetails: recipeDetailsReducer,
  forumPostList: forumPostListReducer,
  forumPostDetails: forumPostDetailsReducer,
  forumPostCreate: forumPostCreateReducer,
  rewards: rewardsReducer,
  rewardTransactions: rewardTransactionsReducer,
  redeemReward: redeemRewardReducer,
  campaigns: campaignsReducer,
  publicSettings: publicSettingsReducer,
  userReviews: userReviewsReducer,
  deleteReview: deleteReviewReducer,
  updateReview: updateReviewReducer,
  refundCreate: refundCreateReducer,
  refundList: refundListReducer,
  refundDetails: refundDetailsReducer,
  referral: referralReducer,
  referralCode: referralCodeReducer,
  wallet: walletReducer,
  withdrawal: withdrawalReducer,
  withdrawalHistory: withdrawalHistoryReducer,
  subscriptionList: subscriptionListReducer,
  subscriptionCreate: subscriptionCreateReducer,
  wishlist: wishlistReducer,
  settings: settingsReducer,
});

const rootReducer = (state, action) => {
  // On logout or cache clear, reset ALL user-scoped state to prevent data leaking between accounts
  if (action.type === 'auth/logout/fulfilled' || action.type === 'CLEAR_CACHE_STATE') {
    // Reset everything — let each reducer start fresh with initial state
    state = undefined;
  }
  return combinedReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firebase auth objects in actions
        ignoredActions: ['auth/login/fulfilled', 'auth/loadFromStorage/fulfilled'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export default store;