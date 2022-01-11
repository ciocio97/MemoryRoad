import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';

@Entity('Users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 45 })
  nickName: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 10 })
  oauthLogin: string;

  @Column({ length: 100 })
  saltedPassword: string;

  @Column({ length: 255 })
  oauthCI: string;

  @Column({ length: 255 })
  profileImage: string;
}
