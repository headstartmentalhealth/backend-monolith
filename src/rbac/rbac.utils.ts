export const filterByRoleGroup = (role_group_id: string) => {
  return {
    role_group_id: role_group_id || undefined,
  };
};

export const formatRole = (role_name: string): string => {
  return role_name.split(' ').join('_').toLowerCase();
};
