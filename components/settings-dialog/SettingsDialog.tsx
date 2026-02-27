'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, FileText, Sun, Moon, Monitor, Check, Package, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import templates from '@/lib/templates';
import modelsData from '@/lib/models.json';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

type Tab = 'general' | 'instructions' | 'templates' | 'models';
type Theme = 'light' | 'dark' | 'system';

interface EnabledSettings {
  templates: Record<string, boolean>;
  models: Record<string, boolean>;
}

export default function SettingsDialog({ isOpen, onClose, userId }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [theme, setTheme] = useState<Theme>('system');
  const [instructions, setInstructions] = useState('');
  const [enabledSettings, setEnabledSettings] = useState<EnabledSettings>({
    templates: {},
    models: {},
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from Supabase on dialog open
  useEffect(() => {
    if (isOpen && userId) {
      const loadSettings = async () => {
        const { data, error } = await supabase
          .from('user_settings')
          .select('theme, ai_instructions, enabled_templates, enabled_models')
          .eq('user_id', userId)
          .single();

        if (data) {
          setTheme(data.theme as Theme || 'system');
          setInstructions(data.ai_instructions || '');
          setEnabledSettings({
            templates: data.enabled_templates || {},
            models: data.enabled_models || {},
          });
          applyTheme(data.theme as Theme || 'system');
        } else {
          applyTheme('system');
          // Initialize all templates and models as enabled by default
          const defaultTemplates: Record<string, boolean> = {};
          const defaultModels: Record<string, boolean> = {};
          Object.keys(templates).forEach(key => {
            defaultTemplates[key] = true;
          });
          const modelsArray = Array.isArray(modelsData) ? modelsData : (modelsData as any).models || [];
          modelsArray.forEach((model: any) => {
            defaultModels[model.id] = true;
          });
          // Set default disabled templates
          defaultTemplates['streamlit-developer'] = false;
          defaultTemplates['gradio-developer'] = false;
          defaultTemplates['code-interpreter-v1'] = false;
          setEnabledSettings({
            templates: defaultTemplates,
            models: defaultModels,
          });
        }
      };
      loadSettings();
    }
  }, [isOpen, userId]);

  const applyTheme = (themeValue: Theme) => {
    const html = document.documentElement;
    if (themeValue === 'dark') {
      html.classList.add('dark');
    } else if (themeValue === 'light') {
      html.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  };

  // Save settings with new state
  const saveSettingsWithNewState = async (newState: EnabledSettings) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        theme,
        ai_instructions: instructions,
        enabled_templates: newState.templates,
        enabled_models: newState.models,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save settings to Supabase
  const saveSettings = async (newSettings: Partial<{
    theme: Theme;
    ai_instructions: string;
    enabled_templates: Record<string, boolean>;
    enabled_models: Record<string, boolean>;
  }>) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        theme: newSettings.theme ?? theme,
        ai_instructions: newSettings.ai_instructions ?? instructions,
        enabled_templates: newSettings.enabled_templates ?? enabledSettings.templates,
        enabled_models: newSettings.enabled_models ?? enabledSettings.models,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    saveSettings({ theme: newTheme });
  };

  const handleInstructionsChange = (newInstructions: string) => {
    setInstructions(newInstructions);
    saveSettings({ ai_instructions: newInstructions });
  };

  const handleTemplateToggle = (templateId: string) => {
    const newTemplates = {
      ...enabledSettings.templates,
      [templateId]: !enabledSettings.templates[templateId],
    };
    const newSettings = {
      ...enabledSettings,
      templates: newTemplates,
    };
    setEnabledSettings(newSettings);
    saveSettingsWithNewState(newSettings);
  };

  const handleModelToggle = (modelId: string) => {
    const newModels = {
      ...enabledSettings.models,
      [modelId]: !enabledSettings.models[modelId],
    };
    const newSettings = {
      ...enabledSettings,
      models: newModels,
    };
    setEnabledSettings(newSettings);
    saveSettingsWithNewState(newSettings);
  };

  // Auto-save instructions when they change
  useEffect(() => {
    if (instructions && userId) {
      const timer = setTimeout(() => {
        saveSettings({ ai_instructions: instructions });
      }, 500); // Debounce by 500ms
      return () => clearTimeout(timer);
    }
  }, [instructions, userId]);

  // Prevent scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="relative flex flex-col md:flex-row w-full max-w-4xl h-[90dvh] md:h-[600px] bg-white dark:bg-black rounded-[1rem] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-zinc-700/50"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 z-10"
          aria-label="Close settings"
        >
          <X size={20} />
        </button>

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-zinc-900/50 border-b md:border-b-0 md:border-r border-gray-100 dark:border-zinc-800 p-4 md:p-6 flex flex-row md:flex-col gap-1 md:gap-2 shrink-0 overflow-x-auto md:overflow-y-auto">
          <h2 className="hidden md:block text-xl font-semibold mb-6 px-2 text-black dark:text-white">Ustawienia</h2>
          
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-[1rem] text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Settings size={16} />
            <span className="hidden md:inline">Ogólne</span>
            <span className="md:hidden">Ogólne</span>
          </button>
          
          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-[1rem] text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'instructions'
                ? 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <FileText size={16} />
            <span>Instrukcje</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-[1rem] text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Package size={16} />
            <span>Szablony</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-[1rem] text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'models'
                ? 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Zap size={16} />
            <span>Modele</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white dark:bg-black">
          {activeTab === 'general' && (
            <div className="space-y-8 max-w-2xl">
              <section>
                <h3 className="text-lg font-medium mb-4 text-black dark:text-white">Motyw</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`group relative flex flex-col items-center justify-center p-6 rounded-[1rem] border transition-all ${
                      theme === 'light'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-zinc-900 text-black dark:text-white'
                        : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <Sun size={24} className="mb-3" />
                    <span className="text-sm font-medium">Jasny</span>
                    {theme === 'light' && (
                      <div className="absolute top-3 right-3 text-black dark:text-white">
                        <Check size={16} />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`group relative flex flex-col items-center justify-center p-6 rounded-[1rem] border transition-all ${
                      theme === 'dark'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-zinc-900 text-black dark:text-white'
                        : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <Moon size={24} className="mb-3" />
                    <span className="text-sm font-medium">Ciemny</span>
                    {theme === 'dark' && (
                      <div className="absolute top-3 right-3 text-black dark:text-white">
                        <Check size={16} />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`group relative flex flex-col items-center justify-center p-6 rounded-[1rem] border transition-all ${
                      theme === 'system'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-zinc-900 text-black dark:text-white'
                        : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <Monitor size={24} className="mb-3" />
                    <span className="text-sm font-medium">System</span>
                    {theme === 'system' && (
                      <div className="absolute top-3 right-3 text-black dark:text-white">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-6 max-w-2xl h-full flex flex-col">
              <div className="flex-none">
                <h3 className="text-lg font-medium mb-2 text-black dark:text-white">Instrukcje dla AI</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Dodaj własne wytyczne, które będą uwzględniane przez asystenta AI oprócz standardowych instrukcji systemowych.
                </p>
              </div>
              <div className="flex-1 min-h-0">
                <textarea
                  value={instructions}
                  onChange={(e) => handleInstructionsChange(e.target.value)}
                  placeholder="Wpisz tutaj swoje instrukcje..."
                  className="w-full h-full p-4 rounded-[1rem] border border-gray-200 dark:border-zinc-800 bg-transparent text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-black dark:focus:border-white resize-none transition-colors text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium mb-2 text-black dark:text-white">Dostępne szablony</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Włącz lub wyłącz szablony, które chcesz mieć dostępne w aplikacji.
                </p>
              </div>
              <div className="space-y-3">
                {Object.entries(templates).filter(([, t]: any) => t.enabled !== false).map(([key, template]: any) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-[1rem] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div>
                      <p className="font-medium text-black dark:text-white">{template.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{key}</p>
                    </div>
                    <button
                      onClick={() => handleTemplateToggle(key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        enabledSettings.templates[key] ?? true
                          ? 'bg-black dark:bg-white'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white dark:bg-black rounded-full transition-transform ${
                          enabledSettings.templates[key] ?? true ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium mb-2 text-black dark:text-white">Dostępne modele</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Włącz lub wyłącz modele, które chcesz mieć dostępne w aplikacji.
                </p>
              </div>
              <div className="space-y-3">
                {(Array.isArray(modelsData) ? modelsData : (modelsData as any).models || []).map((model: any) => (
                  <div key={model.id} className="flex items-center justify-between p-4 rounded-[1rem] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div>
                      <p className="font-medium text-black dark:text-white">{model.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{model.provider}</p>
                    </div>
                    <button
                      onClick={() => handleModelToggle(model.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        enabledSettings.models[model.id] ?? true
                          ? 'bg-black dark:bg-white'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white dark:bg-black rounded-full transition-transform ${
                          enabledSettings.models[model.id] ?? true ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
