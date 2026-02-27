import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { Templates } from '@/lib/templates'

export function ModelPicker({
  models,
  languageModel,
  onLanguageModelChange,
}: {
  models: LLMModel[]
  languageModel: LLMModelConfig
  onLanguageModelChange: (config: LLMModelConfig) => void
}) {
  return (
    <Select
      name="languageModel"
      defaultValue={languageModel.model}
      onValueChange={(e) => onLanguageModelChange({ model: e })}
    >
      <SelectTrigger className="border-none shadow-none focus:ring-0 px-0 py-0 h-auto max-w-[140px] md:max-w-none text-sm whitespace-nowrap">
        <SelectValue placeholder="Model" />
      </SelectTrigger>
      <SelectContent side="bottom" align="start" className="min-w-[200px] max-w-[90vw]">
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-sm">
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TemplatePicker({
  templates,
  selectedTemplate,
  onSelectedTemplateChange,
}: {
  templates: Templates
  selectedTemplate: string
  onSelectedTemplateChange: (template: string) => void
}) {
  return (
    <Select
      name="template"
      defaultValue={selectedTemplate}
      onValueChange={onSelectedTemplateChange}
    >
      <SelectTrigger className="border-none shadow-none focus:ring-0 px-0 py-0 h-auto max-w-[110px] md:max-w-none text-sm">
        <SelectValue placeholder="Template" />
      </SelectTrigger>
      <SelectContent side="bottom" align="start" className="min-w-[200px] max-w-[90vw]">
        <SelectItem value="auto" className="text-sm">Auto</SelectItem>
        {Object.entries(templates).map(([id, template]) => (
          <SelectItem key={id} value={id} className="text-sm">
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
