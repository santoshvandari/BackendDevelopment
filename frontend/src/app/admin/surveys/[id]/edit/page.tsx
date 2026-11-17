'use client'

import { useParams } from 'next/navigation'
import { SurveyEditor } from '@/components/SurveyEditor'

export default function EditSurveyPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  return <SurveyEditor surveyId={id} />
}
