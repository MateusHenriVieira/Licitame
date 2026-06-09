"use client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date | string
  onDateChange: (date: Date | undefined) => void
  id?: string
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({ date, onDateChange, id, placeholder = "Selecione uma data", disabled }: DatePickerProps) {
  // Converter data para formato Date seguro
  const getValidDate = (dateValue?: Date | string): Date | undefined => {
    if (!dateValue) return undefined
    
    try {
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? undefined : dateValue
      }
      
      if (typeof dateValue === 'string') {
        const parsed = new Date(dateValue)
        return isNaN(parsed.getTime()) ? undefined : parsed
      }
    } catch (error) {
      console.error("Erro ao processar data:", error)
      return undefined
    }
    
    return undefined
  }

  const validDate = getValidDate(date)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn("w-full justify-start text-left font-normal bg-transparent", !validDate && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {validDate ? format(validDate, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={validDate} onSelect={onDateChange} initialFocus locale={ptBR} />
      </PopoverContent>
    </Popover>
  )
}
