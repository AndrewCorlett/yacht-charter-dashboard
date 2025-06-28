/**
 * Settings Component
 * 
 * Main settings interface with three primary sections:
 * - Documents: Upload and manage blank form templates
 * - Pricing: Configure yacht pricing for high/low seasons  
 * - Automation: Future automation rules and workflows
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState } from 'react'
import { LABELS } from '../../config/labels.js'
import DocumentsSection from './DocumentsSection.jsx'
import PricingSection from './PricingSection.jsx'
import AutomationSection from './AutomationSection.jsx'
import BreadcrumbHeader from '../common/BreadcrumbHeader.jsx'

function Settings({ onSeascapeClick, onBack }) {
  const [activeTab, setActiveTab] = useState('documents')

  const tabs = [
    { 
      key: 'documents', 
      label: LABELS.SETTINGS.DOCUMENTS, 
      icon: '📄',
      description: 'Upload and manage document templates'
    },
    { 
      key: 'pricing', 
      label: LABELS.SETTINGS.PRICING, 
      icon: '💰',
      description: 'Configure yacht pricing by season'
    },
    { 
      key: 'automation', 
      label: LABELS.SETTINGS.AUTOMATION, 
      icon: '⚡',
      description: 'Automation rules and workflows'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentsSection />
      case 'pricing':
        return <PricingSection />
      case 'automation':
        return <AutomationSection />
      default:
        return <DocumentsSection />
    }
  }

  return (
    <div className="h-full bg-gray-900 text-white overflow-y-auto">
      {/* [Header Navigation] - Breadcrumb navigation for settings */}
      <BreadcrumbHeader
        title={LABELS.NAVIGATION.SETTINGS}
        onSeascapeClick={onSeascapeClick}
        onBack={onBack}
      />

      <div className="p-6">
        {/* [Settings Header] - Main settings title and description */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{LABELS.NAVIGATION.SETTINGS}</h1>
          <p className="text-gray-400">
            Configure system settings, document templates, and pricing for yacht charter operations.
          </p>
        </div>

        {/* [Tab Navigation] - Horizontal tab bar for switching between sections */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* [Tab Content] - Dynamic content area based on selected tab */}
        <div className="space-y-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default Settings