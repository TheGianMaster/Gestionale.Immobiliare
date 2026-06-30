/**
 * src/models/SidebarLayout.ts
 * Configurazione layout sidebar — documento singleton (id: 'main').
 */

import mongoose, { Schema } from 'mongoose'

const SidebarLayoutSchema = new Schema(
  { nodes: { type: [Schema.Types.Mixed], default: [] } },
  { timestamps: true }
)

export const SidebarLayout =
  (mongoose.models?.SidebarLayout as mongoose.Model<{ nodes: unknown[]; updatedAt: Date }> | undefined) ??
  mongoose.model('SidebarLayout', SidebarLayoutSchema)

export default SidebarLayout
