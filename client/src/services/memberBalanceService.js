import API from '../api';

// Get all balances for a group
export const getBalancesForGroup = async (groupId) => {
  const response = await API.get(`/memberBalance/${groupId}`);
  return response.data;
};

// Update balance for a user in a group (positive or negative)
export const updateBalance = async ({ groupId, memberId, amount }) => {
  const response = await API.patch('/memberBalance/update', {
    groupId,
    memberId,
    amount,
  });
  return response.data;
};
