"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScreenerTemplate } from '@/lib/api'
import { Check } from 'lucide-react'

interface TemplateSelectorProps {
  templates: ScreenerTemplate[]
  selectedTemplate?: ScreenerTemplate
  onSelectTemplate: (template: ScreenerTemplate) => void
}

export function TemplateSelector({ templates, selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  // 按分类分组
  const categories = Array.from(new Set(templates.map((t) => t.category)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>预设策略</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.map((category) => (
          <div key={category} className="mb-4 last:mb-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {templates
                .filter((t) => t.category === category)
                .map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                    className="h-auto p-3 justify-start"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {selectedTemplate?.id === template.id && (
                        <Check className="h-4 w-4 flex-shrink-0" />
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
