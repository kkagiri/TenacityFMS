import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { sitemapData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sitemap" subtitle="Pages" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-base lg:grid-cols-3">
          {sitemapData.map((section, idx) => (
            <div className="card" key={idx}>
              <div className="card-body">
                <h5 className="font-bold uppercase">{section.title}</h5>
                <ul className="relative mt-base list-none">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="before:border-default-300 relative before:absolute before:start-2 before:top-0 before:bottom-0 before:border-s before:border-dashed before:content-['']">
                      <a href={item.href || '#'} className={cn('after:border-default-300 relative z-10 flex items-center gap-2 ps-8 font-semibold after:absolute after:start-2 after:top-3 after:w-4 after:border-t after:border-dashed', item.itemClassName)}>
                        {item.icon && <Icon icon={item.icon} className={cn('text-default-400', item.itemClassName)}></Icon>}
                        {item.title}
                      </a>
                      {item.children && (
                        <ul className="relative list-none space-y-1 ps-8 pt-2 pb-3">
                          {item.children.map((child, childIdx) => (
                            <li
                              key={childIdx}
                              className="before:border-default-300 after:border-default-300 hover:text-primary relative transition-all before:absolute before:start-2 before:top-0 before:bottom-0 before:border-s before:border-dashed before:content-[''] after:absolute after:start-2 after:top-3 after:w-4 after:border-t after:border-dashed"
                            >
                              <a href={child.href || '#'} className="relative z-10 inline-block ps-8">
                                {child.title}
                              </a>
                              {child.children && (
                                <ul className="relative list-none space-y-1 ps-8 pt-2">
                                  {child.children.map((subChild, subChildIdx) => (
                                    <li
                                      key={subChildIdx}
                                      className="before:border-default-300 after:border-default-300 hover:text-primary relative transition-all before:absolute before:start-2 before:top-0 before:bottom-0 before:h-3 before:border-s before:border-dashed before:content-[''] after:absolute after:start-2 after:top-3 after:w-4 after:border-t after:border-dashed"
                                    >
                                      <a href={subChild.href || '#'} className="relative z-10 inline-block ps-8">
                                        {subChild.title}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Page
