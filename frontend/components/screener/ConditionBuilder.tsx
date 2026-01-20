"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import { ScreenerCondition } from '@/lib/api'

interface ConditionBuilderProps {
  conditions: ScreenerCondition[]
  onChange: (conditions: ScreenerCondition[]) => void
  availableFields: Record<string, { name: string; type: string; description: string }>
}

const OPERATORS = [
  { value: '>', label: '大于' },
  { value: '>=', label:大于等于' },
  { value: '<', label: '小于' },
  { value: '<=', label: '小于等于' },
  { value: '==', label: '等于' },
  { value: '!=', label: '不等于' },
  { value: 'between', label: '区间' },
  { value: 'contains', label: '包含' },
  { value: 'startswith', label: '开头是' },
]

export function ConditionBuilder({ conditions, onChange, availableFields }: ConditionBuilderProps) {
  const [newCondition, setNewCondition] = useState<Partial<ScreenerCondition>>({
    field: '',
    operator: '>',
    value: '',
  })

  const addCondition = () => {
    if (!newCondition.field || !newCondition.operator || newCondition.value === '') {
      return
    }

    onChange([...conditions, newCondition as ScreenerCondition])
    setNewCondition({ field: '', operator: '>', value: '' })
  }

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index))
  }

  const getFieldValue = (field: string) => {
    const fieldInfo = availableFields[field]
    if (!fieldInfo) return field
    return `${fieldInfo.name} (${field})`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>筛选条件</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 已有条件列表 */}
        {conditions.length > 0 && (
          <div className="space-y-2">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border p-3">
                <span className="flex-1">
                  <span className="font-medium">{getFieldValue(condition.field)}</span>
                  <span className="mx-2 text-muted-foreground">
                    {OPERATORS.find(op => op.value === condition.operator)?.label}
                  </span>
                  <span className="font-medium">{String(condition.value)}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 添加新条件 */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm text-muted-foreground mb-1 block">字段</label>
            <Select
              value={newCondition.field}
              onValueChange={(value) => setNewCondition({ ...newCondition, field: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择字段" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableFields).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.name} ({key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[120px]">
            <label className="text-sm text-muted-foreground mb-1 block">操作符</label>
            <Select
              value={newCondition.operator}
              onValueChange={(value) => setNewCondition({ ...newCondition, operator: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="text-sm text-muted-foreground mb-1 block">值</label>
            <Input
              type={newCondition.operator === 'between' ? 'text' : 'text'}
              placeholder={newCondition.operator === 'between' ? '最小值,最大值' : '输入值'}
              value={newCondition.value}
              onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
            />
          </div>

          <Button onClick={addCondition} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {conditions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            添加筛选条件开始选股
          </p>
        )}
      </CardContent>
    </Card>
  )
}
