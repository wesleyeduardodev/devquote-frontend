import * as React from 'react'

interface PdfIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

/**
 * Ícone PDF estilo doc com badge "PDF" — mais legível que FileText
 * pra distinguir de exportações Excel.
 */
export const PdfIcon = React.forwardRef<SVGSVGElement, PdfIconProps>(
  ({ size = 24, className, ...rest }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {/* doc shape (igual FileText) */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {/* letras "PDF" */}
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="6.2"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      >
        PDF
      </text>
    </svg>
  )
)

PdfIcon.displayName = 'PdfIcon'
