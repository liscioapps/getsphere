import pgPromise from 'pg-promise'

export interface IDatabaseConfig {
  host: string
  port: number
  user: string
  ssl?: boolean | string
  password: string
  database: string
}

export type DbConnection = pgPromise.IDatabase<unknown>
export type DbTransaction = pgPromise.ITask<unknown>
export type DbInstance = pgPromise.IMain
export type DbColumnSet = pgPromise.ColumnSet

export enum TableLockLevel {
  AccessShare = 'access share',
  RowShare = 'row share',
  RowExclusive = 'row exclusive',
  ShareUpdateExclusive = 'share update exclusive',
  Share = 'share',
  ShareRowExclusive = 'share row exclusive',
  Exclusive = 'exclusive',
  AccessExclusive = 'access exclusive',
}

export enum RowLockStrength {
  Update = 'update',
  NoKeyUpdate = 'no key update',
  Share = 'share',
  KeyShare = 'key share',
}

export interface ITableName {
  table: string
  schema?: string
}
