import { BillingInformation, Role, User } from '@prisma/client';

export type BillingInformationSelection = {
  id: BillingInformation['id'];
  address: BillingInformation['address'];
  city: BillingInformation['city'];
  state: BillingInformation['state'];
  apartment: BillingInformation['apartment'];
  postal_code: BillingInformation['postal_code'];
  country: BillingInformation['country'];
  country_code: BillingInformation['country_code'];
  created_at: BillingInformation['created_at'];
};

export type RelatedModels = {
  user: {
    id: User['id'];
    name: User['name'];
    role: { name: Role['name']; role_id: Role['role_id'] };
    // Fetch only required user details
  };
};
