// src/services/budgetService.js
import API from '../api';

export const createBudget = async (budgetData) => {
  try {
    console.log('Creating budget with data:', budgetData);
    const response = await API.post('/budgets', budgetData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGroupBudgets = async (groupId) => {
  try {
    const response = await API.get(`/budgets/group/${groupId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBudgetOverview = async (groupId) => {
  try {
    const response = await API.get(`/budgets/group/${groupId}/overview`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCategories = async (groupId) => {
  try {
    const response = await API.get(`/budgets/group/${groupId}/categories`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBudget = async (budgetId, updateData) => {
  try {
    const response = await API.put(`/budgets/${budgetId}`, updateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteBudget = async (budgetId) => {
  try {
    const response = await API.delete(`/budgets/${budgetId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
