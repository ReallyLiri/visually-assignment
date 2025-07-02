export interface Product {
  _id: {
    $oid: string;
  };
  alias: string;
  collections: string[];
  epochSec: number;
  handle: string;
  id: number;
  image?: {
    height: number;
    width: number;
    position: number;
    src: string;
    variantids?: number[];
  };
  images?: Array<{
    height: number;
    width: number;
    position: number;
    src: string;
    variantids?: number[];
  }>;
  inventoryQuantity: number;
  looxCount: number;
  looxRating: number;
  mainValue?: string;
  okendoCount: number;
  okendoRating: number;
  optionNames: string[];
  options?: Array<{
    name: string;
    values: string[];
  }>;
  orders: number;
  price: number;
  productType?: string;
  publishedAt: {
    $date: string;
  };
  rank: number;
  shopifyCount: number;
  shopifyRating: number;
  stampedCount: number;
  stampedRating: number;
  status: string;
  tags: string[];
  title: string;
  topProduct: boolean;
  variantIds: number[];
  variants?: Array<{
    price: number;
    sku?: string;
    image?: {
      height: number;
      width: number;
      position: number;
      src: string;
      variantids?: number[];
    };
    variant_id: number;
    orders_count?: number;
    inventory_quantity?: number;
    title?: string;
    Color?: string;
    Size?: string;
    [key: string]: any; // For dynamic variant properties
  }>;
  yotpoCount: number;
  yotpoRating: number;
}
