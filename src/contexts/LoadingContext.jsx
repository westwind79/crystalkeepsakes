// src/contexts/LoadingContext.jsx
import React, { createContext, useContext, useReducer } from 'react';

const LoadingContext = createContext(null);

// Action types
const SET_LOADING = 'SET_LOADING';
const SET_INITIAL_LOAD = 'SET_INITIAL_LOAD';

const initialState = {
  isLoading: false,
  isInitialLoad: true,
  loadingTasks: new Set()
};

function loadingReducer(state, action) {
  switch (action.type) {
    case SET_LOADING: {
      const { taskId, isLoading } = action.payload;
      const loadingTasks = new Set(state.loadingTasks);
      
      if (isLoading) {
        loadingTasks.add(taskId);
      } else {
        loadingTasks.delete(taskId);
      }

      return {
        ...state,
        isLoading: loadingTasks.size > 0,
        loadingTasks
      };
    }
    case SET_INITIAL_LOAD:
      return {
        ...state,
        isInitialLoad: action.payload
      };
    default:
      return state;
  }
}

export function LoadingProvider({ children }) {
  const [state, dispatch] = useReducer(loadingReducer, initialState);

  const startLoading = (taskId) => {
    dispatch({ 
      type: SET_LOADING, 
      payload: { taskId, isLoading: true } 
    });
  };

  const stopLoading = (taskId) => {
    dispatch({ 
      type: SET_LOADING, 
      payload: { taskId, isLoading: false } 
    });
  };

  const setInitialLoad = (isInitialLoad) => {
    dispatch({ 
      type: SET_INITIAL_LOAD, 
      payload: isInitialLoad 
    });
  };

  const value = {
    isLoading: state.isLoading,
    isInitialLoad: state.isInitialLoad,
    startLoading,
    stopLoading,
    setInitialLoad
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}