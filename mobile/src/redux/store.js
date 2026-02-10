import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
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
  redeemRewardReducer
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
import { wishlistReducer } from './reducers/wishlistReducers';

const store = configureStore({
  reducer: {
    auth: authReducer,
    productList: productListReducer,
    productDetails: productDetailsReducer,
    productCreateReview: productCreateReviewReducer,
    cart: cartReducer,
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
    userReviews: userReviewsReducer,
    deleteReview: deleteReviewReducer,
    updateReview: updateReviewReducer,
    refundCreate: refundCreateReducer,
    refundList: refundListReducer,
    refundDetails: refundDetailsReducer,
    referral: referralReducer,
    referralCode: referralCodeReducer,
    subscriptionList: subscriptionListReducer,
    subscriptionCreate: subscriptionCreateReducer,
    wishlist: wishlistReducer,
  },
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