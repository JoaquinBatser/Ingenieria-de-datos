import type * as React from "react"

type IconProps = React.SVGProps<SVGSVGElement>

const sharedProps = {
  "aria-hidden": true,
  focusable: false,
  viewBox: "0 0 20 20",
} as const

export function House6FillIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path
        d="m10,6.105l-7,4.648v3.246c0,2.206,1.794,4,4,4h2v-3c0-.552.447-1,1-1s1,.448,1,1v3h2c2.206,0,4-1.794,4-4v-3.217l-7-4.678Z"
        fill="currentColor"
      />
      <path
        d="m17.499,8.5c-.19,0-.383-.054-.554-.168l-6.945-4.63-6.945,4.63c-.462.307-1.082.182-1.387-.277-.307-.459-.183-1.081.277-1.387L9.445,1.668c.336-.224.773-.224,1.109,0l7.5,5c.46.306.584.927.277,1.387-.192.289-.51.445-.833.445Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function FileSearchIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path
        d="m4,7h3c.552,0,1-.448,1-1v-3"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx="13.5"
        cy="13.5"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m16,8.053v-2.053c0-1.657-1.343-3-3-3h-4.586c-.265,0-.52.105-.707.293l-3.414,3.414c-.188.188-.293.442-.293.707v6.586c0,1.657,1.343,3,3,3h1.636"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        x1="17"
        x2="15.268"
        y1="17"
        y2="15.268"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CloneIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path
        d="m13,7h2c1.105,0,2,.895,2,2v6c0,1.105-.895,2-2,2h-6c-1.105,0-2-.895-2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="3"
        width="10"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CloneFilledIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path
        d="m13,7h2c1.105,0,2,.895,2,2v6c0,1.105-.895,2-2,2h-6c-1.105,0-2-.895-2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="3"
        width="10"
        height="10"
        rx="2"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}
