import * as React from "react"
import { FormItemContext } from "./form-context.js"

export const useFormField = () => {
  const itemContext = React.useContext(FormItemContext)

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>")
  }

  const { id } = itemContext

  return {
    id,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  }
}

