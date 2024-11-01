export default interface IUser {
  id: any;
  username: string;
  email: string;
  password: string;
  phone: number;
  user_role: string;
  verified: boolean;
  avatar_public_id?: string;
  avatar_url?: string;
}
