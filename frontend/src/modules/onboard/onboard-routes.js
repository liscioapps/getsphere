import { buildInitialState, store } from '@/store';
import { PermissionChecker } from '@/modules/user/permission-checker';

const OnboardPage = () => import('@/modules/onboard/pages/onboard-page.vue');
const OnboardPlansPage = () => import('@/modules/onboard/pages/onboard-plans-page.vue');
const OnboardPaymentSuccess = () => import('@/modules/onboard/pages/onboard-payment-success.vue');
export default [
  {
    name: 'onboard',
    path: '/onboard',
    component: OnboardPage,
    meta: {
      auth: true,
      title: 'Onboarding',
    },
    beforeEnter: () => {
      const initialState = buildInitialState(true);

      store.replaceState(initialState);
    },
  },
  {
    name: 'onboardPlans',
    path: '/onboard/plans',
    component: OnboardPlansPage,
    meta: {
      auth: true,
      title: 'Choose plan',
    },
  },
  {
    name: 'onboardPaymentSuccess',
    path: '/onboard/payment/success',
    component: OnboardPaymentSuccess,
    meta: {
      title: 'Payment successful',
    },
  },
];
