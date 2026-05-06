import { PageTitle } from "../page-title";

interface RatesTitleProps {
  children?: React.ReactNode;
}

export const RatesTitle = ({ children }: RatesTitleProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <PageTitle title="Rates.title" description="Rates.description" />
      {children}
    </div>
  );
};
