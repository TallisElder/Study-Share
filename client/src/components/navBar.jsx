function NavBar({ title, subtitle, actions }) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {title}
                </h1>
                {subtitle && <p className="mt-2 text-gray-300">{subtitle}</p>}
            </div>

            {actions && (
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    {actions}
                </div>
            )}
        </header>
    );
}

export default NavBar;
