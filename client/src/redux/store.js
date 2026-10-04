import { createSlice, configureStore, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLogin: localStorage.getItem("isLogin") === "true",
  user: (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })(),
};

export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (userData, { rejectWithValue }) => {
    try {
     
      const { data } = await axios.put(`/api/v1/user/${userData.id}`, userData);
      if (!data.success) {
        throw new Error(data.message || "Failed to update user.");
      }
      return data.user;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to update user.";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      // Guard against invalid payloads without returning undefined (which is
      // illegal in an Immer reducer and would throw).
      if (!action.payload || !action.payload._id) {
        return state;
      }
      state.isLogin = true;
      state.user = action.payload;
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout(state) {
      state.isLogin = false;
      state.user = null;
      localStorage.removeItem("isLogin");
      localStorage.removeItem("user");
    },
    // Sync points/level/badges into the store + localStorage after a server
    // award (e.g. a like returned a new level). Today nothing updates these
    // post-like, so the Navbar/Profile showed stale gamification until reload.
    setGamification(state, action) {
      if (!state.user) return;
      const { points, level, badges } = action.payload || {};
      if (points !== undefined) state.user.points = points;
      if (level !== undefined) state.user.level = level;
      if (badges !== undefined) state.user.badges = badges;
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        // Surface the message for the UI; no console logging of user data.
        state.updateError = action.payload;
      });
  },
});

export const authActions = authSlice.actions;

export const { setGamification } = authSlice.actions;

// ---- Notifications slice ----
// The Navbar bell reads `unreadCount` (polled on app mount + every 60s while
// logged in); the Notifications page reads `list` + pagination meta.
export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/api/v1/notifications/unread-count");
      return data.unreadCount || 0;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "failed");
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(
        `/api/v1/notifications?page=${page}&limit=${limit}`
      );
      return { notifications: data.notifications, ...data, page, limit };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "failed");
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.patch("/api/v1/notifications/read-all");
      return data.updated || 0;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "failed");
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
    unreadCount: 0,
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
    status: "idle",
  },
  reducers: {
    clearNotifications(state) {
      state.list = [];
      state.unreadCount = 0;
      state.page = 1;
      state.totalPages = 1;
      state.total = 0;
      state.hasMore = false;
    },
    
    decrementUnread(state) {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { notifications, totalPages, total, hasMore, page } = action.payload;
        state.list = page === 1 ? notifications : [...state.list, ...notifications];
        state.page = page;
        state.totalPages = totalPages || 1;
        state.total = total || 0;
        state.hasMore = !!hasMore;
        state.status = "idle";
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.unreadCount = 0;
        state.list = state.list.map((n) => ({ ...n, read: true }));
      });
  },
});

export const notificationsActions = notificationsSlice.actions;

export const { clearNotifications, decrementUnread } = notificationsSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    notifications: notificationsSlice.reducer,
  },
});