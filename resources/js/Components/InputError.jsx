export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={'text-[13px] font-medium text-red-500 dark:text-red-400 mt-1.5 ' + className}
        >
            {message}
        </p>
    ) : null;
}
