export default interface IProducts {
  name: string;
  category: string;
  price: number;
  desc: string;
  rating?: number;
  stock?: number;
  prod_public_id: string;
  prod_url: string;
}
