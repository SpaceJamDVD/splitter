// client/src/services/transactionService.js
import API from '../api';

export const createTransaction = async ({
  groupId,
  amount,
  description,
  category,
  owedToPurchaser,
  notes,
}) => {
  const response = await API.post('/transactions', {
    groupId,
    amount,
    description,
    category,
    owedToPurchaser,
    notes,
  });
  return response.data;
};

export const getGroupTransactions = async (groupId) => {
  const response = await API.get(`/transactions/group/${groupId}`);
  return response.data;
};

export const settleUp = async (groupId) => {
  const res = await API.post('/transactions/settle', { groupId });
  return res.data;
};
