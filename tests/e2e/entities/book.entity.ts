import {
  ArrayType,
  Cascade,
  Collection,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Page } from "./page.entity";
import { Summary } from "./summary.entity";

@Entity()
export class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({
    nullable: true,
  })
  alias!: string | null;

  @Property({
    hidden: true,
  })
  price!: number;

  @Property({
    default: false,
  })
  favorite!: boolean;

  @Property({
    type: ArrayType,
    nullable: true,
  })
  tags?: string[];

  @OneToMany({
    entity: () => Page,
    mappedBy: (page) => page.book,
    cascade: [Cascade.REMOVE],
  })
  pages = new Collection<Page>(this);

  @OneToOne({
    entity: () => Summary,
    mappedBy: (summary) => summary.book,
    owner: true,
  })
  summary!: Summary;
}
