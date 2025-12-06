import {
  NOTIFICATION_LIST_REQUEST,
  NOTIFICATION_LIST_SUCCESS,
  NOTIFICATION_LIST_FAIL,
  NOTIFICATION_MARK_READ_REQUEST,
  NOTIFICATION_MARK_READ_SUCCESS,
  NOTIFICATION_MARK_READ_FAIL,
  NOTIFICATION_MARK_ALL_READ_REQUEST,
  NOTIFICATION_MARK_ALL_READ_SUCCESS,
  NOTIFICATION_MARK_ALL_READ_FAIL,
  NOTIFICATION_DELETE_REQUEST,
  NOTIFICATION_DELETE_SUCCESS,
  NOTIFICATION_DELETE_FAIL,
  NOTIFICATION_CLEAR_ALL_REQUEST,
  NOTIFICATION_CLEAR_ALL_SUCCESS,
  NOTIFICATION_CLEAR_ALL_FAIL,
  NOTIFICATION_STATS_REQUEST,
  NOTIFICATION_STATS_SUCCESS,
  NOTIFICATION_STATS_FAIL,
  NOTIFICATION_ADD,
  NOTIFICATION_UPDATE,
  NOTIFICATION_REMOVE,
  SET_NOTIFICATION,
  CLEAR_NOTIFICATION
} from '../constants/notificationConstants';

const initialState = {
  notifications: [],
  loading: false,
  error: null,
  stats: {},
  unreadCount: 0,
  total: 0,
  pages: 1,
  page: 1
};

export const notificationReducer = (state = initialState, action) => {
  switch (action.type) {
    case NOTIFICATION_LIST_REQUEST:
    case NOTIFICATION_MARK_READ_REQUEST:
    case NOTIFICATION_MARK_ALL_READ_REQUEST:
    case NOTIFICATION_DELETE_REQUEST:
    case NOTIFICATION_CLEAR_ALL_REQUEST:
    case NOTIFICATION_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case NOTIFICATION_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        total: action.payload.total,
        pages: action.payload.pages,
        page: action.payload.page
      };

    case NOTIFICATION_STATS_SUCCESS:
      return {
        ...state,
        loading: false,
        stats: action.payload
      };

    case NOTIFICATION_MARK_READ_SUCCESS:
      const updatedNotifications = state.notifications.map(notification =>
        notification._id === action.payload.notificationId
          ? { ...notification, read: true }
          : notification
      );
      
      return {
        ...state,
        loading: false,
        notifications: updatedNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_MARK_ALL_READ_SUCCESS:
      const allReadNotifications = state.notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      return {
        ...state,
        loading: false,
        notifications: allReadNotifications,
        unreadCount: 0
      };

    case NOTIFICATION_DELETE_SUCCESS:
      const filteredNotifications = state.notifications.filter(
        notification => notification._id !== action.payload.notificationId
      );
      
      const wasUnread = state.notifications.find(
        n => n._id === action.payload.notificationId && !n.read
      );
      
      return {
        ...state,
        loading: false,
        notifications: filteredNotifications,
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        total: Math.max(0, state.total - 1)
      };

    case NOTIFICATION_CLEAR_ALL_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: [],
        unreadCount: 0,
        total: 0
      };

    case NOTIFICATION_ADD:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 49)],
        unreadCount: state.unreadCount + 1,
        total: state.total + 1
      };

    case NOTIFICATION_UPDATE:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload.notificationId
            ? { ...notification, ...action.payload.updates }
            : notification
        )
      };

    case NOTIFICATION_REMOVE:
      const removedNotification = state.notifications.find(
        n => n._id === action.payload.notificationId
      );
      
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload.notificationId
        ),
        unreadCount: removedNotification && !removedNotification.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
        total: Math.max(0, state.total - 1)
      };

    case NOTIFICATION_LIST_FAIL:
    case NOTIFICATION_MARK_READ_FAIL:
    case NOTIFICATION_MARK_ALL_READ_FAIL:
    case NOTIFICATION_DELETE_FAIL:
    case NOTIFICATION_CLEAR_ALL_FAIL:
    case NOTIFICATION_STATS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case SET_NOTIFICATION:
      return { 
        ...state, 
        message: action.payload.message, 
        type: action.payload.type 
      };

    case CLEAR_NOTIFICATION:
      return { 
        ...state, 
        message: '', 
        type: '' 
      };

    default:
      return state;
  }
};
