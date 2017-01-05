// @flow
import { Pricing } from './Pricing';
export interface PricingRepository {
    find(pricingId: string): Pricing;
}