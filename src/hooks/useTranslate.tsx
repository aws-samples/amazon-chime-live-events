import { useIntl } from 'react-intl';

/* Overloads so we can type the
   conditional return values based on arguments */
function useTranslate(id: string, values?: any): string;
function useTranslate(): (id: string, values?: any) => string;
function useTranslate(id?: string, values?: any) {
  const intl = useIntl();

  if (id) {
    return intl.formatMessage(
      {
        id,
      },
      values
    );
  }

  return (contentId: string, contentValues?: any) =>
    intl.formatMessage({ id: contentId }, contentValues);
}

export default useTranslate;
