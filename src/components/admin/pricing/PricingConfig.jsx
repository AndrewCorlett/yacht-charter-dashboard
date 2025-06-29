/**
 * Pricing Configuration Component
 * 
 * Purpose: Manage yacht pricing rules, seasonal rates, and special offers
 * Provides table/grid interface for pricing management
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useState, useMemo } from 'react'
import { ConfigSection, ConfigGrid, ConfigCard, ActionButton } from '../AdminConfigLayout'

function PricingConfig() {
  const [pricingRules, setPricingRules] = useState([])

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterConfig, setFilterConfig] = useState({
    yacht: 'all',
    ruleType: 'all',
    isActive: 'all'
  })

  // Sort and filter pricing rules
  const sortedAndFilteredRules = useMemo(() => {
    let filteredRules = pricingRules.filter(rule => {
      if (filterConfig.yacht !== 'all' && rule.yachtId !== filterConfig.yacht) return false
      if (filterConfig.ruleType !== 'all' && rule.ruleType !== filterConfig.ruleType) return false
      if (filterConfig.isActive !== 'all' && rule.isActive !== (filterConfig.isActive === 'true')) return false
      return true
    })

    if (sortConfig.key) {
      filteredRules.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filteredRules
  }, [pricingRules, sortConfig, filterConfig])

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDeleteRule = (ruleId) => {
    setPricingRules(rules => rules.filter(rule => rule.id !== ruleId))
  }

  const handleToggleActive = (ruleId) => {
    setPricingRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    )
  }

  const getRuleTypeColor = (ruleType) => {
    switch (ruleType) {
      case 'base': return 'bg-blue-100 text-blue-800'
      case 'seasonal': return 'bg-green-100 text-green-800'
      case 'special': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const SortButton = ({ column, children }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-gray-700"
    >
      <span>{children}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={sortConfig.key === column && sortConfig.direction === 'desc' 
            ? "M5 15l7-7 7 7" 
            : "M19 9l-7 7-7-7"
          }
        />
      </svg>
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <ConfigSection title="Quick Actions">
        <ConfigGrid cols={4}>
          <ConfigCard
            title="Add Daily Rate"
            description="Set base daily pricing for a yacht"
            icon="💰"
            onClick={() => console.log('Add daily rate clicked')}
          />
          <ConfigCard
            title="Add Seasonal Rate"
            description="Create seasonal pricing adjustments"
            icon="📅"
            onClick={() => console.log('Add seasonal rate clicked')}
          />
          <ConfigCard
            title="Add Special Offer"
            description="Create promotional pricing rules"
            icon="🎯"
            onClick={() => console.log('Add special offer clicked')}
          />
          <ConfigCard
            title="Bulk Import"
            description="Import pricing rules from CSV"
            icon="📊"
            onClick={() => console.log('Bulk import clicked')}
          />
        </ConfigGrid>
      </ConfigSection>

      {/* Pricing Rules Table */}
      <ConfigSection 
        title="Pricing Rules"
        description="Manage all yacht pricing rules and seasonal adjustments"
      >
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Yacht:</label>
            <select
              value={filterConfig.yacht}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, yacht: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Yachts</option>
              <option value="calico-moon">Calico Moon</option>
              <option value="spectre">Spectre</option>
              <option value="alrisha">Alrisha</option>
              <option value="disk-drive">Disk Drive</option>
              <option value="zavaria">Zavaria</option>
              <option value="mridula-sarwar">Mridula Sarwar</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Rule Type:</label>
            <select
              value={filterConfig.ruleType}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, ruleType: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Types</option>
              <option value="base">Base Rate</option>
              <option value="seasonal">Seasonal</option>
              <option value="special">Special Offer</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filterConfig.isActive}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, isActive: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <ActionButton variant="outline" size="sm">
            Clear Filters
          </ActionButton>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <SortButton column="yachtName">Yacht</SortButton>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton column="ruleType">Type</SortButton>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton column="rate">Rate</SortButton>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton column="startDate">Period</SortButton>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton column="minHours">Min Hours</SortButton>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton column="priority">Priority</SortButton>
                </th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedAndFilteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rule.yachtName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRuleTypeColor(rule.ruleType)}`}>
                      {rule.ruleType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">
                      {rule.currency} {rule.rate.toLocaleString()}
                      <span className="text-gray-500 text-sm">/{rule.rateType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(rule.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {new Date(rule.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {rule.minHours}h
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {rule.priority}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(rule.id)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        rule.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => console.log('Edit rule', rule.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => console.log('Copy rule', rule.id)}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedAndFilteredRules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2">No pricing rules found</p>
              <p className="text-sm">Try adjusting your filters or create a new pricing rule</p>
            </div>
          )}
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
          <div>
            Showing {sortedAndFilteredRules.length} of {pricingRules.length} pricing rules
          </div>
          <div className="flex items-center space-x-2">
            <ActionButton variant="outline" size="sm">
              Export to CSV
            </ActionButton>
            <ActionButton variant="primary" size="sm">
              Add New Rule
            </ActionButton>
          </div>
        </div>
      </ConfigSection>
    </div>
  )
}

export default PricingConfig