/**
 * Admin Configuration Page Component
 * 
 * Purpose: Main admin interface for business configuration management
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useState } from 'react'
import AdminConfigLayout, { ConfigSection, ConfigGrid, ConfigCard, ActionButton } from './AdminConfigLayout'
import PricingConfig from './pricing/PricingConfig'
import AddPricingRule from './pricing/AddPricingRule'
import EditPricingRule from './pricing/EditPricingRule'
import SeasonalPricing from './pricing/SeasonalPricing'

function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState('pricing')
  const [isLoading, setIsLoading] = useState(false)
  
  // Pricing-related state
  const [pricingView, setPricingView] = useState('overview') // overview, rules, seasonal
  const [isAddPricingModalOpen, setIsAddPricingModalOpen] = useState(false)
  const [isEditPricingModalOpen, setIsEditPricingModalOpen] = useState(false)
  const [selectedPricingRule, setSelectedPricingRule] = useState(null)

  const tabs = [
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'yachts', label: 'Yachts', icon: '⛵' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'policies', label: 'Policies', icon: '📋' }
  ]

  const handleSavePricingRule = (pricingRule) => {
    console.log('Saving pricing rule:', pricingRule)
    // In real app, this would save to backend
    setIsAddPricingModalOpen(false)
  }

  const handleUpdatePricingRule = (updatedRule) => {
    console.log('Updating pricing rule:', updatedRule)
    // In real app, this would update in backend
    setIsEditPricingModalOpen(false)
    setSelectedPricingRule(null)
  }

  const renderPricingContent = () => {
    switch (pricingView) {
      case 'rules':
        return <PricingConfig />
      case 'seasonal':
        return <SeasonalPricing />
      case 'overview':
      default:
        return (
          <ConfigSection 
            title="Pricing Configuration"
            description="Manage yacht pricing rules, seasonal rates, and special offers."
          >
            <ConfigGrid cols={3}>
              <ConfigCard
                title="Pricing Rules"
                description="Manage base rates and pricing logic"
                icon="💲"
                onClick={() => setPricingView('rules')}
              />
              <ConfigCard
                title="Seasonal Pricing"
                description="Set high/low season rate adjustments"
                icon="📅"
                onClick={() => setPricingView('seasonal')}
              />
              <ConfigCard
                title="Special Offers"
                description="Create promotional pricing rules"
                icon="🎯"
                onClick={() => setIsAddPricingModalOpen(true)}
              />
            </ConfigGrid>
          </ConfigSection>
        )
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pricing':
        return (
          <div className="space-y-6">
            {/* Pricing Navigation */}
            {pricingView !== 'overview' && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPricingView('overview')}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Pricing Overview
                </button>
                <div className="text-sm text-gray-600 capitalize">
                  {pricingView} Management
                </div>
              </div>
            )}
            
            {renderPricingContent()}
          </div>
        )

      case 'yachts':
        return (
          <ConfigSection 
            title="Yacht Management"
            description="Manage yacht specifications, amenities, and marketing content."
          >
            <ConfigGrid cols={2}>
              <ConfigCard
                title="Yacht Specifications"
                description="Length, capacity, engine details, etc."
                icon="⚓"
                onClick={() => console.log('Yacht specs clicked')}
              />
              <ConfigCard
                title="Amenities & Equipment"
                description="Manage available features and equipment"
                icon="🎛️"
                onClick={() => console.log('Amenities clicked')}
              />
              <ConfigCard
                title="Photo Gallery"
                description="Upload and organize yacht images"
                icon="📸"
                onClick={() => console.log('Photo gallery clicked')}
              />
              <ConfigCard
                title="Marketing Content"
                description="Descriptions and promotional materials"
                icon="📝"
                onClick={() => console.log('Marketing content clicked')}
              />
            </ConfigGrid>
          </ConfigSection>
        )

      case 'documents':
        return (
          <ConfigSection 
            title="Document Templates"
            description="Manage contract templates, invoices, and customer communications."
          >
            <ConfigGrid cols={3}>
              <ConfigCard
                title="Contract Templates"
                description="Charter agreements and terms"
                icon="📋"
                onClick={() => console.log('Contract templates clicked')}
              />
              <ConfigCard
                title="Invoice Templates"
                description="Billing and payment documents"
                icon="💰"
                onClick={() => console.log('Invoice templates clicked')}
              />
              <ConfigCard
                title="Quote Templates"
                description="Customer proposal documents"
                icon="📊"
                onClick={() => console.log('Quote templates clicked')}
              />
            </ConfigGrid>
          </ConfigSection>
        )

      case 'policies':
        return (
          <ConfigSection 
            title="Business Policies"
            description="Configure business rules, payment terms, and operational policies."
          >
            <ConfigGrid cols={2}>
              <ConfigCard
                title="Payment Terms"
                description="Deposit requirements and payment schedules"
                icon="💳"
                onClick={() => console.log('Payment terms clicked')}
              />
              <ConfigCard
                title="Booking Rules"
                description="Minimum booking periods and restrictions"
                icon="📅"
                onClick={() => console.log('Booking rules clicked')}
              />
              <ConfigCard
                title="Cancellation Policy"
                description="Cancellation terms and fee structures"
                icon="❌"
                onClick={() => console.log('Cancellation policy clicked')}
              />
              <ConfigCard
                title="Contact Information"
                description="Business contact details and hours"
                icon="📞"
                onClick={() => console.log('Contact information clicked')}
              />
            </ConfigGrid>
          </ConfigSection>
        )

      default:
        return null
    }
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <ActionButton variant="outline" size="sm">
        Export Config
      </ActionButton>
      <ActionButton variant="primary" size="sm">
        Save Changes
      </ActionButton>
    </div>
  )

  return (
    <AdminConfigLayout
      title="Admin Configuration"
      description="Manage business settings and operational configuration"
      headerActions={headerActions}
    >
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Pricing Modals */}
      <AddPricingRule
        isOpen={isAddPricingModalOpen}
        onClose={() => setIsAddPricingModalOpen(false)}
        onSave={handleSavePricingRule}
      />
      
      <EditPricingRule
        isOpen={isEditPricingModalOpen}
        onClose={() => {
          setIsEditPricingModalOpen(false)
          setSelectedPricingRule(null)
        }}
        onSave={handleUpdatePricingRule}
        pricingRule={selectedPricingRule}
      />
    </AdminConfigLayout>
  )
}

export default AdminConfigPage