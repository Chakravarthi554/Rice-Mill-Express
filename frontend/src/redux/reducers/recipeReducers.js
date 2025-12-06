import {
  RECIPE_SUBMIT_REQUEST, RECIPE_SUBMIT_SUCCESS, RECIPE_SUBMIT_FAIL, RECIPE_SUBMIT_RESET,
  RECIPE_LIST_REQUEST, RECIPE_LIST_SUCCESS, RECIPE_LIST_FAIL,
  RECIPE_LIST_MY_REQUEST, RECIPE_LIST_MY_SUCCESS, RECIPE_LIST_MY_FAIL,
  RECIPE_LIST_PENDING_REQUEST, RECIPE_LIST_PENDING_SUCCESS, RECIPE_LIST_PENDING_FAIL,
  RECIPE_DETAILS_REQUEST, RECIPE_DETAILS_SUCCESS, RECIPE_DETAILS_FAIL, RECIPE_DETAILS_RESET,
  RECIPE_APPROVE_REQUEST, RECIPE_APPROVE_SUCCESS, RECIPE_APPROVE_FAIL, RECIPE_APPROVE_RESET,
  RECIPE_RATE_REQUEST, RECIPE_RATE_SUCCESS, RECIPE_RATE_FAIL, RECIPE_RATE_RESET,
  RECIPE_COMMENT_REQUEST, RECIPE_COMMENT_SUCCESS, RECIPE_COMMENT_FAIL, RECIPE_COMMENT_RESET,
  RECIPE_DELETE_REQUEST, RECIPE_DELETE_SUCCESS, RECIPE_DELETE_FAIL,
  RECIPE_COMMENT_MODERATE_REQUEST, RECIPE_COMMENT_MODERATE_SUCCESS, RECIPE_COMMENT_MODERATE_FAIL,
  RECIPE_COMMENT_REPORT_REQUEST, RECIPE_COMMENT_REPORT_SUCCESS, RECIPE_COMMENT_REPORT_FAIL,
  RECIPE_FLAGGED_COMMENTS_REQUEST, RECIPE_FLAGGED_COMMENTS_SUCCESS, RECIPE_FLAGGED_COMMENTS_FAIL,
} from '../constants/RecipeConstants';

// Reducer for submitting a new recipe (Seller)
export const recipeSubmitReducer = (state = {}, action) => {
  switch (action.type) {
    case RECIPE_SUBMIT_REQUEST: return { loading: true };
    case RECIPE_SUBMIT_SUCCESS: return { loading: false, success: true, recipe: action.payload };
    case RECIPE_SUBMIT_FAIL: return { loading: false, error: action.payload };
    case RECIPE_SUBMIT_RESET: return {};
    default: return state;
  }
};

// Reducer for listing approved recipes (Public/Customer)
const initialListState = { recipes: [], loading: false, error: null, page: 1, pages: 1, total: 0 };
export const recipeListReducer = (state = initialListState, action) => {
  switch (action.type) {
    case RECIPE_LIST_REQUEST: return { ...state, loading: true, recipes: [] };
    case RECIPE_LIST_SUCCESS: return {
        loading: false,
        recipes: action.payload.recipes,
        page: action.payload.page,
        pages: action.payload.pages,
        total: action.payload.total,
        error: null,
      };
    case RECIPE_LIST_FAIL: return { ...state, loading: false, error: action.payload };
    default: return state;
  }
};

// Reducer for listing seller's own recipes
export const recipeListMyReducer = (state = initialListState, action) => {
    switch (action.type) {
        case RECIPE_LIST_MY_REQUEST: return { ...state, loading: true, recipes: [] };
        case RECIPE_LIST_MY_SUCCESS: return {
            loading: false,
            recipes: action.payload.recipes,
            page: action.payload.page,
            pages: action.payload.pages,
            total: action.payload.total,
            error: null,
        };
        case RECIPE_LIST_MY_FAIL: return { ...state, loading: false, error: action.payload };
        default: return state;
    }
};

// Reducer for listing pending recipes (Admin)
export const recipeListPendingReducer = (state = initialListState, action) => {
    switch (action.type) {
        case RECIPE_LIST_PENDING_REQUEST: return { ...state, loading: true, recipes: [] };
        case RECIPE_LIST_PENDING_SUCCESS: return {
            loading: false,
            recipes: action.payload.recipes,
            page: action.payload.page,
            pages: action.payload.pages,
            total: action.payload.total,
            error: null,
        };
        case RECIPE_LIST_PENDING_FAIL: return { ...state, loading: false, error: action.payload };
        // Handle approve/reject success to remove item from pending list
        case RECIPE_APPROVE_SUCCESS:
            return {
                ...state,
                recipes: state.recipes.filter(recipe => recipe._id !== action.payload._id),
                total: state.total - 1,
            };
        default: return state;
    }
};

// Reducer for recipe details
export const recipeDetailsReducer = (state = { recipe: { linkedProducts: [], comments: [], ratings: [] } }, action) => {
  switch (action.type) {
    case RECIPE_DETAILS_REQUEST: return { ...state, loading: true };
    case RECIPE_DETAILS_SUCCESS: return { loading: false, recipe: action.payload, error: null };
    case RECIPE_DETAILS_FAIL: return { loading: false, error: action.payload };
    case RECIPE_DETAILS_RESET: return { recipe: { linkedProducts: [], comments: [], ratings: [] } };
    default: return state;
  }
};

// Reducer for approving/rejecting a recipe (Admin)
export const recipeApproveReducer = (state = {}, action) => {
  switch (action.type) {
    case RECIPE_APPROVE_REQUEST: return { loading: true };
    case RECIPE_APPROVE_SUCCESS: return { loading: false, success: true };
    case RECIPE_APPROVE_FAIL: return { loading: false, error: action.payload };
    case RECIPE_APPROVE_RESET: return {};
    default: return state;
  }
};

// Reducer for rating a recipe
export const recipeRateReducer = (state = {}, action) => {
  switch (action.type) {
    case RECIPE_RATE_REQUEST: return { loading: true };
    case RECIPE_RATE_SUCCESS: return { loading: false, success: true };
    case RECIPE_RATE_FAIL: return { loading: false, error: action.payload };
    case RECIPE_RATE_RESET: return {};
    default: return state;
  }
};

// Reducer for commenting on a recipe
export const recipeCommentReducer = (state = {}, action) => {
  switch (action.type) {
    case RECIPE_COMMENT_REQUEST: return { loading: true };
    case RECIPE_COMMENT_SUCCESS: return { loading: false, success: true };
    case RECIPE_COMMENT_FAIL: return { loading: false, error: action.payload };
    case RECIPE_COMMENT_RESET: return {};
    default: return state;
  }
};

// Reducer for deleting a recipe (Admin/Seller)
export const recipeDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case RECIPE_DELETE_REQUEST: return { loading: true };
        case RECIPE_DELETE_SUCCESS: return { loading: false, success: true };
        case RECIPE_DELETE_FAIL: return { loading: false, error: action.payload };
        default: return state;
    }
};

// NEW: Recipe Comment Moderation Reducers
export const recipeCommentModerateReducer = (state = { loading: false, success: false, error: null, data: null }, action) => {
  switch (action.type) {
    case RECIPE_COMMENT_MODERATE_REQUEST: return { loading: true };
    case RECIPE_COMMENT_MODERATE_SUCCESS: return { loading: false, success: true, data: action.payload };
    case RECIPE_COMMENT_MODERATE_FAIL: return { loading: false, error: action.payload };
    default: return state;
  }
};

export const recipeCommentReportReducer = (state = { loading: false, success: false, error: null, data: null }, action) => {
  switch (action.type) {
    case RECIPE_COMMENT_REPORT_REQUEST: return { loading: true };
    case RECIPE_COMMENT_REPORT_SUCCESS: return { loading: false, success: true, data: action.payload };
    case RECIPE_COMMENT_REPORT_FAIL: return { loading: false, error: action.payload };
    default: return state;
  }
};

export const recipeFlaggedCommentsReducer = (state = { comments: [], loading: false, error: null, page: 1, pages: 1, total: 0 }, action) => {
  switch (action.type) {
    case RECIPE_FLAGGED_COMMENTS_REQUEST: return { ...state, loading: true, error: null };
    case RECIPE_FLAGGED_COMMENTS_SUCCESS: return {
        loading: false,
        comments: Array.isArray(action.payload.comments) ? action.payload.comments : [],
        page: action.payload.page || 1,
        pages: action.payload.pages || 1,
        total: action.payload.total || 0,
    };
    case RECIPE_FLAGGED_COMMENTS_FAIL: return { ...state, loading: false, error: action.payload };
    default: return state;
  }
};