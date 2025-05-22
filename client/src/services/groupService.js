import API from '../api';

export const createGroup = async ({name, description}) => {
    const response = await API.post('/groups/new', {
        name,
        description,
    });

    return response.data;
}

export const getMyGroups = async () => {
    const response = await API.get('/groups/my');
    return response.data;
}