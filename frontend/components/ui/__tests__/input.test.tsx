import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input Component', () => {
  it('should render input field', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should apply default classes', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('flex')
    expect(input).toHaveClass('h-9')
  })

  it('should accept user input', async () => {
    render(<Input />)
    const input = screen.getByRole('textbox')

    await userEvent.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should render with type password', () => {
    const { container } = render(<Input type="password" />)
    const input = container.querySelector('input[type="password"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('password')
  })

  it('should render with type number using spinbutton role', () => {
    render(<Input type="number" />)
    // number inputs use spinbutton role, not textbox
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.type).toBe('number')
  })

  it('should render with type email', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.type).toBe('email')
  })

  it('should call onChange when value changes', async () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')

    await userEvent.type(input, 'a')
    expect(handleChange).toHaveBeenCalled()
  })

  it('should render with icon', () => {
    render(
      <div className="relative">
        <Input
          className="pl-10"
          placeholder="Search"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          Icon
        </div>
      </div>
    )
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    expect(screen.getByText('Icon')).toBeInTheDocument()
  })

  it('should accept custom className', () => {
    render(<Input className="custom-class" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('should render with default text type', () => {
    render(<Input />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.type).toBe('text')
  })
})
