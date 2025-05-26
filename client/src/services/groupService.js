import API from '../api';

export const createGroup = async ({ name, description }) => {
  const response = await API.post('/groups/new', {
    name,
    description,
  });

  return response.data;
};

export const getUserGroup = async () => {
  const response = await API.get('/groups/user-group');
  return response.data;
};

export const getGroupById = async (id) => {
  const response = await API.get(`/groups/${id}`);
  return response.data;
};

export const joinGroupWithToken = async (inviteToken) => {
  const response = await API.post(`/groups/join/${inviteToken}`);
  return response.data;
};
