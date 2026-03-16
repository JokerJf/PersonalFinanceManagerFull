import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';

@Entity('family_groups')
export class FamilyGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  leaderId: number;

  @OneToMany(() => User, (user) => user.familyGroup)
  members: User[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  inviteCode: string;
}
