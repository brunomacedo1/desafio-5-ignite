import Head from 'next/head';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  // eslint-disable-next-line react/no-unused-prop-types
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  async function handleLoadMorePosts(): Promise<void> {
    const postUpdatedArray = [...posts.results];
    await fetch(`${postsPagination.next_page}`)
      .then(response => response.json())
      .then(data => {
        data.results.map(result => {
          const post = {
            uid: result.uid,
            first_publication_date: result.first_publication_date,
            data: {
              title: result.data.title,
              subtitle: result.data.subtitle,
              author: result.data.author,
            },
          };
          // postUpdatedArray.push(post);

          postsPagination.results.push(post);
          postsPagination.next_page = data.next_page;

          // eslint-disable-next-line no-useless-return
          return;
        });
        setPosts({
          next_page: data.next_page,
          results: [...postUpdatedArray],
        });
      });
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={styles.postContainer}>
        <div className={styles.post}>
          <div>
            <img src="/images/logo.svg" alt="logo" />
          </div>
          {postsPagination.results.map(post => (
            <div className={styles.postLink} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <FiCalendar />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </a>
              </Link>
            </div>
          ))}
          {postsPagination.next_page ? (
            <button
              className={styles.loadButton}
              type="button"
              onClick={() => handleLoadMorePosts()}
              disabled={postsPagination.next_page === null}
            >
              Carregar mais posts{' '}
            </button>
          ) : null}
          <button className={styles.previewButton} type="button">
            Sair do modo Preview
          </button>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 2 }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(result => {
      return {
        uid: result.uid,
        first_publication_date: result.first_publication_date,
        data: {
          author: result.data.author,
          title: result.data.title,
          subtitle: result.data.subtitle,
        },
      };
    }),
  };

  return {
    props: { postsPagination },
    revalidate: 60 * 60,
  };
  // TODO
};
