import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { FamilyGroup } from './FamilyGroup';

export enum FamilyRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined'
}

export enum FamilyRequestType {
  CREATE_GROUP = 'create_group',  // User wants to create a new family group
  JOIN_GROUP = 'join_group'        // User wants to join an existing group
}

@Entity('family_requests')
export class FamilyRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  senderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ nullable: true })
  recipientId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({
    type: 'enum',
    enum: FamilyRequestStatus,
    default: FamilyRequestStatus.PENDING
  })
  status: FamilyRequestStatus;

  @Column({
    type: 'enum',
    enum: FamilyRequestType,
    default: FamilyRequestType.JOIN_GROUP
  })
  type: FamilyRequestType;

  @Column({ nullable: true })
  familyGroupId: number;

  @ManyToOne(() => FamilyGroup, { nullable: true })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  respondedAt: Date;
}
