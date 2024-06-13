interface SuifrenCardProps {
  suiFrenSvg: string | null;
}

const SuifrensCard: React.FC<SuifrenCardProps> = ({ suiFrenSvg }) => {
    const defaultSvgPath = "/frens/voidfren.svg";
    return (
        <div className='sui-fren-container'>
            {suiFrenSvg ? (
                <div
                className="sui-fren-image"
                dangerouslySetInnerHTML={{ __html: suiFrenSvg }}
                />
            ) : (
                <img
                    src={defaultSvgPath}
                    alt='Void Fren'
                    className='sui-fren-image'
                />
            )}
        </div>
    );
};

export default SuifrensCard;