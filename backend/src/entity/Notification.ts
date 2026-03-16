import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column({ nullable: true })
  title: string;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  type: string;

  @Column()
  userId: number;

  // ID связанного запроса в семью (для accept/decline)
  @Column({ nullable: true })
  relatedRequestId: number;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
